<?php

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Connectors\MySqlConnector;

class CustomMySqlConnector extends MySqlConnector {
    public function connect(array $config) {
        $config['options'] = isset($config['options']) ? $config['options'] : [];
        $config['options'][PDO::MYSQL_ATTR_SSL_CA] = base_path('cacert.pem'); // Dummy path, just to trigger SSL
        $config['options'][PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        return parent::connect($config);
    }
}
