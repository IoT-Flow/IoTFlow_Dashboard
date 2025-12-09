import CustomChart from './CustomChart';

const TelemetryChart = ({ chartConfig, telemetryData, onEdit, onDelete, devices = [] }) => {
  // This is a wrapper component for the main telemetry chart that still uses the old pattern
  // We pass telemetryData directly to maintain backward compatibility
  return (
    <CustomChart
      chartConfig={chartConfig}
      telemetryData={telemetryData}
      onEdit={onEdit}
      onDelete={onDelete}
      isMainChart={true} // Add flag to indicate this is the main chart
      devices={devices}
    />
  );
};

export default TelemetryChart;
