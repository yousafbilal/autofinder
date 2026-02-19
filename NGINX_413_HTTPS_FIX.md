# Fix 413 on HTTPS (https://backend.autofinder.pk)

App **HTTPS** use karti hai, isliye request **port 443** wale server block se guzarti hai.  
Sirf port 80 wale block mein `client_max_body_size` add karne se 413 fix nahi hota.

---

## Server par ye steps karo

### 1. HTTPS config file kholo

Jis file mein **backend.autofinder.pk** ka **listen 443** wala block hai, wahi kholo. Ho sakta hai:

- `/etc/nginx/sites-available/autofinder-backend`  
  ya  
- `/etc/nginx/sites-enabled/autofinder-backend`  
  ya  
- `/etc/nginx/conf.d/autofinder.conf`  
  ya koi aur site config.

Dhundhne ke liye:

```bash
sudo grep -r "listen 443" /etc/nginx/
```

Jis path mein `backend.autofinder.pk` ya backend site dikhe, wahi file edit karni hai.

### 2. Usi file mein HTTPS server block dhoondo

Kuch is tarah dikhega:

```nginx
server {
    listen 443 ssl http2;
    # listen [::]:443 ssl http2;
    server_name backend.autofinder.pk;
    ...
}
```

### 3. Is **server { }** ke andar sabse upar (server_name ke baad) ye 2 lines add karo:

```nginx
    client_max_body_size 100M;
    client_body_buffer_size 256k;
```

Example (pehle / baad):

**Pehle:**
```nginx
server {
    listen 443 ssl http2;
    server_name backend.autofinder.pk;

    # SSL certs...
    ssl_certificate ...
```

**Baad (ye 2 lines add):**
```nginx
server {
    listen 443 ssl http2;
    server_name backend.autofinder.pk;

    client_max_body_size 100M;
    client_body_buffer_size 256k;

    # SSL certs...
    ssl_certificate ...
```

### 4. Save karo, test karo, reload karo

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Agar HTTPS block alag file mein ho

Agar `listen 443` wala block kisi **dusri file** mein hai (jaise `default`, ya `ssl.conf`), to **us file** ke andar **us server { }** block mein bhi yehi 2 lines add karo:

```nginx
    client_max_body_size 100M;
    client_body_buffer_size 256k;
```

---

Isse **HTTPS** par bhi 413 fix ho jana chahiye.
