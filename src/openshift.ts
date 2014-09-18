export var localIp = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
export var port = parseInt(process.argv[2], 10) || process.env.OPENSHIFT_NODEJS_PORT || 8080;
