# Glossary

## Technical Terms

| Term                  | Definition                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| **API**               | Application Programming Interface; contract between client and server       |
| **JWT**               | JSON Web Token; compact, URL-safe token for authentication                  |
| **RBAC**              | Role-Based Access Control; permission system based on user roles            |
| **CORS**              | Cross-Origin Resource Sharing; browser security mechanism for HTTP requests |
| **CSRF**              | Cross-Site Request Forgery; attack that tricks users into unwanted actions  |
| **HSTS**              | HTTP Strict Transport Security; forces HTTPS connections                   |
| **CSP**               | Content Security Policy; restricts resource loading origins                |
| **SQL Injection**     | Attack inserting malicious SQL through user input                          |
| **XSS**               | Cross-Site Scripting; injecting malicious scripts into web pages           |
| **WebSocket**         | Full-duplex communication protocol for real-time data                      |
| **Socket.io**         | Library for real-time bidirectional event-based communication              |
| **SPA**               | Single Page Application; web app that loads once and navigates dynamically |
| **SSR**               | Server-Side Rendering; rendering pages on the server before sending        |
| **CDN**               | Content Delivery Network; distributed server network for fast content       |
| **ETag**              | Entity Tag; HTTP cache validation mechanism                                |
| **Rate Limiting**     | Restricting number of requests per time window                             |
| **Connection Pool**   | Reusable database connections to avoid overhead                             |
| **Soft Delete**       | Marking records as deleted without removing them from database             |
| **Idempotent**        | Operation that produces same result regardless of how many times it runs   |
| **Webhook**           | HTTP callback triggered by events in another system                        |
| **Service Worker**    | Background script for offline support and caching                          |
| **Lazy Loading**      | Deferring load of non-critical resources until needed                      |
| **Code Splitting**    | Breaking code into smaller bundles loaded on demand                        |
| **Tree Shaking**      | Removing unused code from final bundle                                     |
| **Virtual Scrolling** | Rendering only visible items in large lists                                |
| **Debounce**          | Delaying function execution until input stops changing                     |
| **Throttle**          | Limiting function execution to once per time period                        |
| **Memoization**       | Caching function results for repeated inputs                               |
| **Memoization**       | Caching function results for repeated inputs                               |

---

## Business Terms

### Menu Categories (Italian)

| Italian Term    | English      | Description                                      |
|-----------------|--------------|--------------------------------------------------|
| **Antipasti**   | Appetizers   | Small dishes served before the main course       |
| **Pasta**       | Pasta        | Various pasta dishes with different sauces       |
| **Pizza**       | Pizza        | Traditional Italian pizzas with various toppings |
| **Risotto**     | Risotto      | Creamy rice dishes with various ingredients      |
| **Carne**       | Meat         | Meat-based main courses                          |
| **Pesce**       | Seafood      | Fish and seafood dishes                          |
| **Insalate**    | Salads       | Fresh salad compositions                         |
| **Dolci**       | Desserts     | Sweet courses and pastries                       |
| **Bevande**     | Beverages    | Non-alcoholic drinks                             |
| **Vino**        | Wine         | Wine selection                                   |

### Menu Items (Examples)

| Item                    | Category  | Description                                    |
|-------------------------|-----------|------------------------------------------------|
| **Bruschetta**          | Antipasti | Toasted bread with tomatoes, garlic, basil     |
| **Carpaccio**           | Antipasti | Thinly sliced raw beef with arugula            |
| **Fettuccine Alfredo**  | Pasta     | Flat pasta in creamy Parmesan sauce            |
| **Penne Arrabbiata**    | Pasta     | Tube pasta in spicy tomato sauce               |
| **Margherita**          | Pizza     | Tomato, mozzarella, basil                      |
| **Quattro Formaggi**    | Pizza     | Four cheese pizza                              |
| **Risotto ai Funghi**   | Risotto   | Mushroom risotto                               |
| **Osso Buco**           | Carne     | Braised veal shanks                            |
| **Branzino**            | Pesce     | Mediterranean sea bass                         |
| **Tiramisu**            | Dolci     | Coffee-flavored Italian dessert                |
| **Panna Cotta**         | Dolci     | Chilled cream dessert                          |
| **Cannoli**             | Dolci     | Fried pastry shells with ricotta filling       |

### Order Statuses

| Status            | Description                                  |
|-------------------|----------------------------------------------|
| **pending**       | Order placed, awaiting confirmation          |
| **confirmed**     | Order accepted by restaurant                 |
| **preparing**     | Kitchen is preparing the order               |
| **ready**         | Order ready for pickup/delivery              |
| **out_for_delivery** | Order is being delivered                  |
| **delivered**     | Order has been delivered                     |
| **completed**     | Order fully completed                        |
| **cancelled**     | Order was cancelled                          |

### Reservation Statuses

| Status        | Description                                    |
|---------------|------------------------------------------------|
| **pending**   | Reservation awaiting confirmation              |
| **confirmed** | Reservation confirmed by restaurant            |
| **seated**    | Guests are seated at table                     |
| **completed** | Meal completed, guests departed                |
| **cancelled** | Reservation was cancelled                      |
| **no_show**   | Guests did not arrive                          |

### Order Types

| Type        | Description                              |
|-------------|------------------------------------------|
| **dine_in** | Eating at the restaurant                 |
| **takeout** | Picking up food to eat elsewhere         |
| **delivery**| Food delivered to customer's address     |

### User Roles

| Role        | Description                              |
|-------------|------------------------------------------|
| **customer**| Regular user who places orders           |
| **staff**   | Restaurant employee (future use)         |
| **admin**   | Full access to management features       |

---

## Abbreviations

| Abbreviation | Full Form                                    |
|--------------|----------------------------------------------|
| **API**      | Application Programming Interface            |
| **URL**      | Uniform Resource Locator                     |
| **URI**      | Uniform Resource Identifier                  |
| **HTTP**     | HyperText Transfer Protocol                  |
| **HTTPS**    | HTTP Secure (with TLS)                       |
| **TLS**      | Transport Layer Security                     |
| **SSL**      | Secure Sockets Layer (legacy, replaced by TLS)|
| **CORS**     | Cross-Origin Resource Sharing                |
| **CSRF**     | Cross-Site Request Forgery                   |
| **XSS**      | Cross-Site Scripting                         |
| **JWT**      | JSON Web Token                               |
| **JIT**      | Just-In-Time (compilation)                   |
| **CRUD**     | Create, Read, Update, Delete                 |
| **REST**     | Representational State Transfer              |
| **SPA**      | Single Page Application                      |
| **SSR**      | Server-Side Rendering                        |
| **CSR**      | Client-Side Rendering                        |
| **PWA**      | Progressive Web App                          |
| **CDN**      | Content Delivery Network                     |
| **SQL**      | Structured Query Language                    |
| **ORM**      | Object-Relational Mapping                    |
| **DBMS**     | Database Management System                   |
| **ETL**      | Extract, Transform, Load                     |
| **CI/CD**    | Continuous Integration/Continuous Deployment |
| **Docker**   | Platform for containerized applications      |
| **VM**       | Virtual Machine                              |
| **npm**      | Node Package Manager                         |
| **npx**      | Node Package Execute (runner)                |
| **ESM**      | ES Modules (JavaScript module system)        |
| **CJS**      | CommonJS (Node.js module system)             |
| **IIFE**     | Immediately Invoked Function Expression      |
| **DTO**      | Data Transfer Object                         |
| **DAL**      | Data Access Layer                            |
| **MVC**      | Model-View-Controller                        |
| **MVVM**     | Model-View-ViewModel                         |
| **FIFO**     | First In, First Out                          |
| **TTL**      | Time To Live                                 |
| **RBAC**     | Role-Based Access Control                    |
| **HSTS**     | HTTP Strict Transport Security               |
| **CSP**      | Content Security Policy                      |
| **SRI**      | Subresource Integrity                        |
