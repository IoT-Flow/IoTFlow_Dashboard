// Real IoTDB client using REST API
const http = require('http');

const IOTDB_HOST = process.env.IOTDB_HOST || 'localhost';
const IOTDB_REST_PORT = process.env.IOTDB_REST_PORT || '18080';
const IOTDB_USERNAME = process.env.IOTDB_USERNAME || 'root';
const IOTDB_PASSWORD = process.env.IOTDB_PASSWORD || 'root';

class IoTDBClient {
  constructor() {
    this.baseUrl = `http://${IOTDB_HOST}:${IOTDB_REST_PORT}`;
    this.auth = Buffer.from(`${IOTDB_USERNAME}:${IOTDB_PASSWORD}`).toString('base64');
  }

  async testConnection() {
    try {
      const testSQL = 'SHOW DATABASES';
      const result = await this.executeSQL(testSQL);
      console.log('IoTDB connection test successful:', result);
      return true;
    } catch (error) {
      console.error('IoTDB connection test failed:', error.message);
      throw new Error(`Cannot connect to IoTDB REST API: ${error.message}`);
    }
  }

  async executeSQL(sql) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ sql });

      const options = {
        hostname: IOTDB_HOST,
        port: IOTDB_REST_PORT,
        path: '/rest/v2/query', // Updated for IoTDB 2.0.3
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          Authorization: `Basic ${this.auth}`,
        },
      };

      console.log('Executing SQL via REST API:', sql);
      console.log('REST API URL:', `${this.baseUrl}${options.path}`);

      const req = http.request(options, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            console.log('Raw REST API response:', data);
            const result = JSON.parse(data);

            // Check for errors in IoTDB response
            if (result.code && result.code !== 200) {
              reject(new Error(`IoTDB Error (${result.code}): ${result.message}`));
              return;
            }

            // For COUNT queries, extract the count value
            if (sql.includes('COUNT(*)') && result.values && result.values.length > 0) {
              const count = result.values[0][0] || 0;
              resolve({ count: parseInt(count) });
              return;
            }

            // Return the full result for other queries
            resolve(result);
          } catch (e) {
            console.error('Error parsing REST API response:', e);
            reject(new Error(`Failed to parse IoTDB response: ${e.message}`));
          }
        });
      });

      req.on('error', e => {
        console.error('REST API request error:', e);
        if (e.code === 'ECONNRESET') {
          reject(new Error('IoTDB connection reset - service may be unavailable'));
        } else if (e.code === 'ETIMEDOUT') {
          reject(new Error('IoTDB connection timeout - service may be unreachable'));
        } else {
          reject(new Error(`Failed to connect to IoTDB REST API: ${e.message}`));
        }
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('IoTDB request timeout after 5 seconds'));
      });

      req.write(postData);
      req.end();
    });
  }

  async insertRecord(devicePath, data, timestamp) {
    try {
      // For IoTDB, we need to create the timeseries first if it doesn't exist
      // Then insert the data using the correct syntax

      const measurements = Object.keys(data);
      const values = Object.values(data);

      // Create timeseries if they don't exist (ignore errors if they already exist)
      for (let i = 0; i < measurements.length; i++) {
        const measurement = measurements[i];
        const value = values[i];
        const dataType =
          typeof value === 'number' ? (Number.isInteger(value) ? 'INT64' : 'DOUBLE') : 'TEXT';

        const createSQL = `CREATE TIMESERIES ${devicePath}.${measurement} WITH DATATYPE=${dataType}`;
        try {
          await this.executeSQL(createSQL);
          console.log(`Created timeseries: ${devicePath}.${measurement}`);
        } catch (createError) {
          // Ignore if timeseries already exists
          if (!createError.message.includes('already exists')) {
            console.warn(
              `Failed to create timeseries ${devicePath}.${measurement}:`,
              createError.message
            );
          }
        }
      }

      // Build proper IoTDB INSERT statement
      // IoTDB syntax: INSERT INTO root.sg1.d1(timestamp,s1,s2) values(1,1,1)
      const measurementsList = measurements.join(', ');
      const valuesList = values
        .map(value => {
          return typeof value === 'string' ? `'${value}'` : value;
        })
        .join(', ');

      const sql = `INSERT INTO ${devicePath}(timestamp, ${measurementsList}) VALUES(${timestamp}, ${valuesList})`;
      console.log('Executing INSERT:', sql);
      const result = await this.executeSQL(sql);
      console.log('Insert result:', result);

      // Check if insert was successful (no error in response)
      return !result.code || result.code === 200;
    } catch (error) {
      console.error('Failed to insert record:', error);
      throw error;
    }
  }

  async queryRecords(devicePath, measurements, startTs, endTs, limit, page) {
    try {
      const measurementClause = measurements[0] === '*' ? '*' : measurements.join(', ');
      let sql = `SELECT ${measurementClause} FROM ${devicePath}`;

      const whereClauses = [];
      if (startTs) {
        whereClauses.push(`time >= ${startTs}`);
      }
      if (endTs) {
        whereClauses.push(`time <= ${endTs}`);
      }
      if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      sql += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

      console.log('Executing query:', sql);
      const result = await this.executeSQL(sql);

      // Transform IoTDB sparse data format into organized records
      const records = [];

      if (result.timestamps && result.expressions && result.values) {
        const timestamps = result.timestamps;
        const expressions = result.expressions; // Full measurement paths
        const valueRows = result.values;

        // Process each timestamp
        timestamps.forEach((timestamp, timeIndex) => {
          const record = {
            Time: timestamp,
            timestamp: new Date(timestamp).toISOString(),
          };

          // Process each measurement for this timestamp
          expressions.forEach((fullPath, measurementIndex) => {
            const value = valueRows[measurementIndex][timeIndex];

            if (value !== null && value !== undefined) {
              // Extract just the measurement name from the full path
              // e.g., "root.iotflow.devices.users.user_5.device_13.temperature" -> "temperature"
              const measurementName = fullPath.split('.').pop();
              record[measurementName] = value;
            }
          });

          // Only add record if it has data beyond just timestamp
          if (Object.keys(record).length > 2) {
            records.push(record);
          }
        });
      } else if (result.values && result.columnNames) {
        // Fallback for different response format
        const columns = result.columnNames;
        const rows = result.values;

        rows.forEach(row => {
          const record = {};
          columns.forEach((col, index) => {
            record[col] = row[index];
          });
          records.push(record);
        });
      } else if (result.expressions && result.values) {
        // Alternative format
        const columns = result.expressions;
        const rows = result.values;

        rows.forEach(row => {
          const record = {};
          columns.forEach((col, index) => {
            record[col] = row[index];
          });
          records.push(record);
        });
      }

      return records;
    } catch (error) {
      console.error('Failed to query records:', error);
      throw error;
    }
  }

  async aggregate(devicePath, data_type, aggregation, startTs, endTs) {
    try {
      let sql = `SELECT ${aggregation}(${data_type}) FROM ${devicePath}`;

      const whereClauses = [];
      if (startTs) {
        whereClauses.push(`time >= ${startTs}`);
      }
      if (endTs) {
        whereClauses.push(`time <= ${endTs}`);
      }
      if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      console.log('Executing aggregation:', sql);
      const result = await this.executeSQL(sql);

      if (result.values && result.columnNames && result.values.length > 0) {
        const aggregateResult = {};
        result.columnNames.forEach((col, index) => {
          aggregateResult[col] = result.values[0][index];
        });
        return aggregateResult;
      } else if (result.expressions && result.values && result.values.length > 0) {
        const aggregateResult = {};
        result.expressions.forEach((col, index) => {
          aggregateResult[col] = result.values[0][index];
        });
        return aggregateResult;
      }

      throw new Error('No aggregation data found');
    } catch (error) {
      console.error('Failed to aggregate data:', error);
      throw error;
    }
  }
}

const client = new IoTDBClient();

module.exports = {
  // Test IoTDB REST API connection
  async testConnection() {
    return await client.testConnection();
  },

  // Insert telemetry record
  async insertRecord(devicePath, data, timestamp) {
    return await client.insertRecord(devicePath, data, timestamp);
  },

  // Query telemetry records
  async queryRecords(devicePath, measurements, startTs, endTs, limit, page) {
    return await client.queryRecords(devicePath, measurements, startTs, endTs, limit, page);
  },

  // Aggregate telemetry data
  async aggregate(devicePath, data_type, aggregation, startTs, endTs) {
    return await client.aggregate(devicePath, data_type, aggregation, startTs, endTs);
  },

  // Execute SQL directly (for compatibility)
  async executeSQL(sql) {
    return await client.executeSQL(sql);
  },
};
