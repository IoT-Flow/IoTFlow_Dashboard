# 🚀 IoTFlow Dashboard - Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### 🔒 **Security Configuration**
- [ ] Change `JWT_SECRET` in `iotflow-backend/.env`
- [ ] Change `SESSION_SECRET` in `iotflow-backend/.env`
- [ ] Update `CORS_ORIGIN` to your production domain
- [ ] Update `ALLOWED_ORIGINS` with your domain(s)
- [ ] Set `NODE_ENV=production` in backend .env
- [ ] Set `REACT_APP_ENVIRONMENT=production` in frontend .env

### 🌐 **Environment Configuration**
- [ ] Update `REACT_APP_API_URL` to your production API URL
- [ ] Update `REACT_APP_WS_URL` to your production WebSocket URL
- [ ] Configure database settings (PostgreSQL for production)
- [ ] Set up SSL certificates (for HTTPS)
- [ ] Configure email settings (if using notifications)

### 📊 **Database Setup**
- [ ] Initialize database: `npm run init-db`
- [ ] Verify database connectivity
- [ ] Set up database backups
- [ ] Configure database connection pooling (if using PostgreSQL)

### 🐳 **Docker Configuration** (if using Docker)
- [ ] Review `docker-compose.yml` settings
- [ ] Configure volume mounts for data persistence
- [ ] Set up health checks
- [ ] Configure restart policies

### 🔧 **Application Build**
- [ ] Run `npm run install:all`
- [ ] Run `npm run build:all`
- [ ] Verify build artifacts exist
- [ ] Test production build locally

### 🌍 **Web Server Configuration**
- [ ] Configure Nginx/Apache reverse proxy
- [ ] Set up SSL/TLS certificates
- [ ] Configure GZIP compression
- [ ] Set up static file caching
- [ ] Configure security headers

### 📈 **Monitoring & Logging**
- [ ] Set up application logs
- [ ] Configure error monitoring (Sentry, etc.)
- [ ] Set up performance monitoring
- [ ] Configure health check endpoints
- [ ] Set up uptime monitoring

### 🔐 **Security Hardening**
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Set up fail2ban (if applicable)
- [ ] Regular security updates
- [ ] Remove development tools from production

### ✅ **Testing**
- [ ] Test user authentication
- [ ] Test device registration
- [ ] Test real-time data updates
- [ ] Test WebSocket connectivity
- [ ] Test API endpoints
- [ ] Test responsive design on mobile devices

## 🚀 Deployment Commands

### Quick Production Deployment
```bash
# 1. Install and build
npm run install:all
npm run build:all

# 2. Start production servers
npm run start:prod
```

### Docker Deployment
```bash
# 1. Configure environment files
cp iotflow-backend/.env.example iotflow-backend/.env
cp iotflow-frontend/.env.example iotflow-frontend/.env

# 2. Update .env files with production values

# 3. Deploy with Docker
docker-compose up -d
```

## 🌐 Access URLs

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001/api
- **WebSocket**: ws://localhost:3001/ws
- **Health Check**: http://localhost:3001/health

## 🔧 Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change default credentials immediately after first login!

## 📞 Support & Troubleshooting

### Common Issues
1. **Port conflicts**: Ensure ports 3000 and 3001 are available
2. **Database errors**: Check database permissions and configuration
3. **WebSocket issues**: Verify WebSocket port and CORS settings
4. **Build failures**: Check Node.js version (18+) and dependencies

### Log Locations
- **Backend logs**: `iotflow-backend/logs/app.log`
- **Frontend build logs**: Console output during build
- **Database logs**: Check database-specific log location

### Performance Optimization
- Enable GZIP compression on web server
- Set up CDN for static assets
- Configure database connection pooling
- Enable browser caching for static files

## 🎉 Success Criteria

Your deployment is successful when:
- [ ] Dashboard loads without errors
- [ ] User can login with admin credentials
- [ ] Device management functions work
- [ ] Real-time data updates display
- [ ] WebSocket connection is established
- [ ] API endpoints respond correctly
- [ ] Mobile responsive design works
