# 413 Fix – Main nginx.conf mein add karo (ek baar, sab fix)

Jab bhi **413 Request Entity Too Large** aaye, ye steps **server par** run karo. Isse **saari** sites (HTTP + HTTPS) par **100MB** body allow ho jati hai.

---

## Step 1: Main config kholo

```bash
sudo nano /etc/nginx/nginx.conf
```

---

## Step 2: `http {` block dhoondo

File mein `http {` likha hoga. Uske **turant andar** (next line pe) ye **2 lines add** karo:

```nginx
http {
    client_max_body_size 100M;
    client_body_buffer_size 256k;
    # ... baaki jo pehle se hai (include, default_type, etc.)
```

**Example – Pehle:**
```nginx
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
```

**Example – Baad (ye 2 lines add ki):**
```nginx
http {
    client_max_body_size 100M;
    client_body_buffer_size 256k;
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
```

---

## Step 3: Save aur reload

- **Save:** Ctrl+O, Enter  
- **Exit:** Ctrl+X  

Phir:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 4: Test

App se phir se ad post karo (3–4 large images ke sath). 413 nahi aana chahiye.

---

**Note:** Agar `client_max_body_size` pehle se `http { }` ke andar kahi aur likha hai (jaise `1m`), to use **100M** se replace kar do.
