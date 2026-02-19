# Fix: "http directive is duplicate" in nginx.conf

Matlab file mein **do baar** `http {` aa gaya hai. Nginx mein **sirf ek** `http {` block hona chahiye.

---

## Kya karna hai

### 1. File kholo

```bash
sudo nano /etc/nginx/nginx.conf
```

### 2. Duplicate block hatao (line ~84 ke paas)

Tumne shayad aisa add kiya hoga:

```nginx
     http {
       client_max_body_size 100M;
       client_body_buffer_size 256k;
       include /etc/nginx/mime.types;
       ...
```

**Ye pura block mat chhodo.** Sirf **ye 3 cheezein karo:**

- **`http {`** — ye line **delete** karo (duplicate hai, pehle se ek `http {` file mein hai).
- **`...`** — ye bhi **delete** karo (sirf example tha).
- **Sirf ye 2 lines rakhna hai** (kisi bhi `http {` ke andar, ek hi jagah):

```nginx
       client_max_body_size 100M;
       client_body_buffer_size 256k;
```

### 3. Option A: Agar tumne naya `http {` block banaya tha

- Naya wala **`http {`** aur **`...`** hata do.
- **client_max_body_size** aur **client_body_buffer_size** ki 2 lines **waheen** chhod do, lekin **us block ke andar** jo pehle se **`http {`** hai (file mein upar/neeche), usme **move** kar do.

Yaani: file mein jahan **pehli baar** `http {` aata hai (bina #), uske turant andar ye 2 lines add karo:

```nginx
http {
    client_max_body_size 100M;
    client_body_buffer_size 256k;
    include /etc/nginx/mime.types;
    # ... baaki sab pehle jaisa
```

Aur jo **dusra** `http {` tumne add kiya tha (line 84 ke paas) — **pura** woh block (from `http {` to `}`) **delete** kar do.

### 4. Option B: Simple tarika

1. **Ctrl+W** (Where Is) → type: `http {` → Enter.  
   Jo **pehla** `http {` mile (line number yaad kar lo).
2. Phir **dusra** `http {` dhoondo (line 84 ke paas).
3. **Dusre** wale `http {` se shuru hoke, tumne jo naya block likha hai (jaise `http {` + 2 lines + `include` + `...`) — **sirf `http {` aur `...` hata do**, **2 lines wahi rehne do**.
4. Agar ab bhi do alag `http {` blocks dikhen, to **dusra pura block delete** karo (from `http {` to matching `}`), aur **pehle** wale `http {` ke andar jao aur wahan ye 2 lines add karo:
   - `client_max_body_size 100M;`
   - `client_body_buffer_size 256k;`

### 5. Final check

- File mein **sirf ek** `http {` hona chahiye.
- Usi ke andar ye 2 lines honi chahiye:
  - `client_max_body_size 100M;`
  - `client_body_buffer_size 256k;`

Save: **Ctrl+O**, Enter. Exit: **Ctrl+X**.

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Agar phir bhi error aaye to batao — tum `nginx.conf` ka around line 80–90 wala hissa (jahan duplicate `http {` hai) copy-paste kar do, main exact lines bata dunga kya delete karna hai.
