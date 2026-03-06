# http { } block ke andar 2 lines add karo

Tumhare file mein ye hai:

```nginx
http {

        ##
        # Basic Settings
        ##

        sendfile on;
        tcp_nopush on;
        ...
```

**Kya karna hai:** Isi `http {` ke andar, sabse upar (sendfile se pehle) ye 2 lines add karo:

```nginx
http {

        client_max_body_size 100M;
        client_body_buffer_size 256k;

        ##
        # Basic Settings
        ##

        sendfile on;
        tcp_nopush on;
        types_hash_max_size 2048;
        # server_tokens off;
```

Save → `sudo nginx -t` → `sudo systemctl reload nginx`.
