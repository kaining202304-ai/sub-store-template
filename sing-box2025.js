const fs = require('fs');

let config = JSON.parse(fs.readFileSync('./sing-box.json', 'utf-8'));
let proxies = [];

function getTrue() {
    return true;
}

if (process.argv.length > 2) {
    let nodes = fs.readFileSync(process.argv[2], 'utf-8').split('\n').filter(line => line.trim() !== '');
    nodes.forEach(node => {
        let config_inbounds = {};
        let config_outbounds = {};

        node = node.replace(/#.*/g, '');
        node = node.replace(/\u200E|\u200F/g, '');
        console.log(node);

        let base_info = node.substring(node.indexOf('//') + 2);
        if (node.startsWith('vmess://')) {
            base_info = Buffer.from(base_info, 'base64').toString();
            base_info = JSON.parse(base_info);
            config_outbounds.server = base_info.add;
            config_outbounds.server_port = Number(base_info.port);
            config_outbounds.uuid = base_info.id;
            config_outbounds.type = 'vless';
            config_outbounds.tls = { "enabled": getTrue(), "server_name": base_info.add, "insecure": true };

            if (base_info.net === 'ws') {
                config_outbounds.transport = { "type": "ws", "path": base_info.path, "headers": { "Host": base_info.host } };
            }
            else if (base_info.net === 'grpc') {
                config_outbounds.transport = { "type": "grpc", "service_name": base_info.path };
            }
        }
        else if (node.startsWith('trojan://')) {
            config_outbounds.server = base_info.substring(base_info.indexOf('@') + 1, base_info.lastIndexOf(':'));
            config_outbounds.server_port = Number(base_info.substring(base_info.lastIndexOf(':') + 1, base_info.indexOf('?')));
            config_outbounds.password = base_info.substring(0, base_info.indexOf('@'));
            config_outbounds.type = 'trojan';

            let params = new URLSearchParams(base_info.substring(base_info.indexOf('?') + 1));
            config_outbounds.tls = { "enabled": getTrue(), "server_name": params.get('sni') || params.get('peer') || config_outbounds.server, "insecure": true };

            if (params.get('type') === 'ws') {
                config_outbounds.transport = { "type": "ws", "path": params.get('path'), "headers": { "Host": params.get('host') } };
            }
            else if (params.get('type') === 'grpc') {
                config_outbounds.transport = { "type": "grpc", "service_name": params.get('serviceName') };
            }
        }

        if (config_outbounds.server) {
            config_outbounds.tag = config_outbounds.server + ':' + config_outbounds.server_port;
            proxies.push(config_outbounds.tag);
            config.outbounds.push(config_outbounds);

            config_inbounds.type = 'socks';
            config_inbounds.tag = config_outbounds.server + ':' + config_outbounds.server_port + ' in';
            config_inbounds.listen = '127.0.0.1';
            config_inbounds.listen_port = config_outbounds.server_port;
            config.inbounds.push(config_inbounds);
        }
    });

    // 更新 proxy 和 all-auto 的 outbounds
    config.outbounds.forEach(outbound => {
        if (outbound.tag === "proxy" || outbound.tag === "all-auto") {
            outbound.outbounds = proxies;
        }
    });

    fs.writeFileSync('./sb.json', JSON.stringify(config, null, 2));
}
