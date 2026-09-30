const ADMIN_USERNAME="admin";
const WHATSAPP_NUMBER="21627049943";
const DEFAULT_ADMIN_PASSWORD_HASH="8784ec77ede999217eaffe2353ddf6a1fabc65523f67f39b59218614715bc45a";
const DEFAULT_SIZES=["S","M","L","XL","XXL"];
let currentCategory="all",selectedOrderProduct=null;

function getProducts(){try{const x=JSON.parse(localStorage.getItem("kriaa_products")||"[]");return Array.isArray(x)?x:[]}catch{return[]}}
function saveProducts(x){localStorage.setItem("kriaa_products",JSON.stringify(x))}
function normalizeProduct(p){return {...p,sizes:Array.isArray(p.sizes)&&p.sizes.length?p.sizes:DEFAULT_SIZES}}
function setCategory(c){currentCategory=c;document.querySelectorAll(".category-btn").forEach(b=>b.classList.toggle("active",b.dataset.category===c));renderProducts()}
function show(id){if(id==="adminDashboard"&&!isAdmin()){alert("غير مسموح بالدخول إلى لوحة الإدارة.");return}document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));const e=document.getElementById(id);if(!e)return;e.classList.add("active");if(id==="shop")renderProducts();if(id==="portfolio")renderPortfolio();if(id==="adminDashboard"){renderAdminOrders();renderAdminProducts();renderAdminPortfolio()}document.getElementById("mainNav")?.classList.remove("mobile-open");scrollTo({top:0,behavior:"smooth"})}
function toggleMobileMenu(){document.getElementById("mainNav").classList.toggle("mobile-open")}

function renderProducts(){
 const c=document.getElementById("productsContainer");if(!c)return;
 const search=(document.getElementById("searchInput").value||"").trim().toLowerCase();
 const ps=getProducts().map(normalizeProduct).filter(p=>p.visible!==false).filter(p=>currentCategory==="all"||p.category===currentCategory).filter(p=>!search||`${p.name} ${p.description} ${p.category}`.toLowerCase().includes(search));
 c.innerHTML="";
 if(!ps.length){c.innerHTML='<p class="admin-note">لا توجد ملابس حاليًا. أضف القطع من Admin.</p>';return}
 ps.sort((a,b)=>(a.position||0)-(b.position||0)).forEach(p=>{
  const card=document.createElement("article");card.className="card";
  const wrap=document.createElement("div");wrap.className="product-image-wrapper";
  const img=document.createElement("img");img.src=p.image||"";img.alt=p.name;img.loading="lazy";wrap.appendChild(img);
  if(p.badgeEnabled&&p.badgeText){const b=document.createElement("span");b.className="product-badge";b.textContent=p.badgeText;wrap.appendChild(b)}
  const h=document.createElement("h3");h.textContent=p.name;
  const d=document.createElement("p");d.className="card-description";d.textContent=p.description||"";
  const pa=document.createElement("div");pa.className="price-area";pa.innerHTML=`<span class="price">${escapeHTML(p.price||"")}</span>${p.discount&&p.oldPrice?` <span class="old-price">${escapeHTML(p.oldPrice)}</span>`:""}<div class="size-preview">Tailles: ${escapeHTML(p.sizes.join(" · "))}</div>`;
  const actions=document.createElement("div");actions.className="card-actions";
  const buy=document.createElement("button");buy.className="buy-btn";buy.textContent="شراء";buy.onclick=()=>openOrder(p);
  const desc=document.createElement("button");desc.className="desc-btn";desc.textContent="وصف";desc.onclick=()=>alert("ℹ️ "+(p.description||"لا يوجد وصف"));
  actions.append(buy,desc);card.append(wrap,h,d,pa,actions);c.appendChild(card);
 })
}

function openOrder(p){
 selectedOrderProduct=normalizeProduct(p);
 document.getElementById("orderTitle").textContent=p.name;
 document.getElementById("orderSummary").textContent=p.description||"اختر المقاس وأكمل بيانات الطلب.";
 document.getElementById("orderUsername").value="";document.getElementById("orderWhatsApp").value="";document.getElementById("orderNotes").value="";
 document.getElementById("orderMessage").textContent="";document.getElementById("orderReview").style.display="none";document.getElementById("orderFormFields").style.display="block";
 const s=document.getElementById("orderSize");s.innerHTML='<option value="">اختر المقاس / Taille</option>';selectedOrderProduct.sizes.forEach(x=>{const o=document.createElement("option");o.value=x;o.textContent=x;s.appendChild(o)});
 document.getElementById("orderTotal").textContent=p.price||"—";document.getElementById("orderModal").classList.add("show")
}
function closeOrder(){document.getElementById("orderModal").classList.remove("show");selectedOrderProduct=null}
function getDraft(){
 if(!selectedOrderProduct)return null;
 const name=document.getElementById("orderUsername").value.trim(),size=document.getElementById("orderSize").value,wa=document.getElementById("orderWhatsApp").value.trim(),notes=document.getElementById("orderNotes").value.trim();
 if(!name||!size||!wa)return{error:"يرجى إدخال الاسم والمقاس ورقم WhatsApp."};
 return{productId:selectedOrderProduct.id,productName:selectedOrderProduct.name,customerName:name,size,whatsappNumber:wa,notes,price:selectedOrderProduct.price,createdAt:new Date().toISOString(),status:"pending"}
}
function reviewOrder(){const d=getDraft(),m=document.getElementById("orderMessage");if(!d||d.error){m.textContent=d?.error||"حدث خطأ.";return}window.currentOrderDraft=d;document.getElementById("orderReviewContent").innerHTML=`<div class="review-line"><strong>Article</strong><span>${escapeHTML(d.productName)}</span></div><div class="review-line"><strong>Nom</strong><span>${escapeHTML(d.customerName)}</span></div><div class="review-line"><strong>Taille</strong><span>${escapeHTML(d.size)}</span></div><div class="review-line"><strong>WhatsApp</strong><span>${escapeHTML(d.whatsappNumber)}</span></div>${d.notes?`<div class="review-line"><strong>Notes</strong><span>${escapeHTML(d.notes)}</span></div>`:""}<div class="review-total"><strong>Prix</strong><strong>${escapeHTML(d.price)}</strong></div>`;document.getElementById("orderFormFields").style.display="none";document.getElementById("orderReview").style.display="block"}
function backToOrderForm(){document.getElementById("orderReview").style.display="none";document.getElementById("orderFormFields").style.display="block"}
function getOrders(){try{const x=JSON.parse(localStorage.getItem("kriaa_orders")||"[]");return Array.isArray(x)?x:[]}catch{return[]}}
function saveOrder(o){const a=getOrders();a.unshift({...o,id:Date.now()});localStorage.setItem("kriaa_orders",JSON.stringify(a));return a[0]}
function confirmAndSendOrder(){const d=window.currentOrderDraft;if(!d)return;const o=saveOrder(d);let t=`KRIAA — NOUVELLE COMMANDE\nArticle: ${d.productName}\nNom: ${d.customerName}\nTaille: ${d.size}\nWhatsApp: ${d.whatsappNumber}\nPrix: ${d.price} DT\n`;if(d.notes)t+=`Notes: ${d.notes}\n`;t+=`Order ID: ${o.id}`;window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t)}`,"_blank");closeOrder();window.currentOrderDraft=null;if(isAdmin())renderAdminOrders()}
function whatsapp(){window.open(`https://wa.me/${WHATSAPP_NUMBER}`,"_blank")}

function openLogin(){document.getElementById("loginModal").classList.add("show");document.getElementById("loginMessage").textContent=""}
function closeLogin(){document.getElementById("loginModal").classList.remove("show")}
async function sha256(t){const data=new TextEncoder().encode(t),h=await crypto.subtle.digest("SHA-256",data);return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,"0")).join("")}
async function ensureAdminPassword(){if(!localStorage.getItem("kriaa_admin_password_hash"))localStorage.setItem("kriaa_admin_password_hash",DEFAULT_ADMIN_PASSWORD_HASH)}
async function login(){const u=document.getElementById("usernameInput").value.trim(),p=document.getElementById("passwordInput").value,m=document.getElementById("loginMessage");if(!u||!p){m.textContent="يرجى إدخال البيانات.";return}await ensureAdminPassword();if(u===ADMIN_USERNAME&&await sha256(p)===localStorage.getItem("kriaa_admin_password_hash")){localStorage.setItem("kriaa_logged_in","true");localStorage.setItem("kriaa_role","admin");closeLogin();updateLoginUI();alert("تم تسجيل الدخول كـ Admin.");return}localStorage.setItem("kriaa_logged_in","true");localStorage.setItem("kriaa_role","user");closeLogin();updateLoginUI();alert("تم تسجيل الدخول.")}
function isLoggedIn(){return localStorage.getItem("kriaa_logged_in")==="true"}function isAdmin(){return isLoggedIn()&&localStorage.getItem("kriaa_role")==="admin"}
function updateLoginUI(){const l=document.getElementById("loginButton"),a=document.getElementById("adminButton"),o=document.getElementById("logoutButton");if(l)l.style.display=isLoggedIn()?"none":"inline-block";if(a)a.style.display=isAdmin()?"inline-block":"none";if(o)o.style.display=isLoggedIn()?"inline-block":"none"}
function logout(){localStorage.removeItem("kriaa_logged_in");localStorage.removeItem("kriaa_role");updateLoginUI();show("home")}
function openAdminDashboard(){if(isAdmin())show("adminDashboard");else alert("غير مسموح.")}
function openAdminTab(id,b){document.querySelectorAll(".admin-content").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".admin-tab").forEach(x=>x.classList.remove("active"));document.getElementById(id).classList.add("active");b.classList.add("active");if(id==="ordersAdmin")renderAdminOrders();if(id==="productsAdmin")renderAdminProducts();if(id==="portfolioAdmin")renderAdminPortfolio()}

function fileToDataURL(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
async function addProduct(){
 if(!isAdmin())return;const name=newProductName.value.trim(),price=newProductPrice.value.trim(),oldPrice=newProductOldPrice.value.trim(),desc=newProductDescription.value.trim(),category=newProductCategory.value,sizes=(newProductSizes.value.trim()||getSettings().sizes.join(",")).split(",").map(x=>x.trim()).filter(Boolean),file=newProductImageFile.files[0];if(!name||!price){alert("أدخل اسم القطعة والسعر.");return}
 let image=newProductImage.value.trim();if(file)image=await fileToDataURL(file);
 const ps=getProducts();ps.push({id:Date.now(),name,price,oldPrice,discount:Boolean(oldPrice),image,description:desc,category,sizes,visible:true,badgeEnabled:newProductBadge.checked,badgeText:newProductBadgeText.value.trim()||"PROMO",position:ps.length+1});saveProducts(ps);["newProductName","newProductPrice","newProductOldPrice","newProductImage","newProductDescription","newProductSizes","newProductBadgeText"].forEach(id=>document.getElementById(id).value="");newProductBadge.checked=false;renderProducts();renderAdminProducts();alert("تمت إضافة قطعة الملابس.")
}
function renderAdminProducts(){const c=document.getElementById("adminProducts");if(!c||!isAdmin())return;c.innerHTML="";getProducts().forEach(p=>{const x=document.createElement("div");x.className="admin-product";x.innerHTML=`<img src="${escapeHTML(p.image||"")}" alt=""><div class="admin-product-info"><h4>${escapeHTML(p.name)}</h4><span>${escapeHTML(p.price)}</span><br><small>${p.visible!==false?"Visible":"Hidden"} · ${escapeHTML(p.sizes.join(", "))}</small></div><div class="admin-actions"></div>`;const a=x.querySelector(".admin-actions");a.append(btn("تعديل","edit-btn",()=>editProduct(p.id)),btn(p.visible!==false?"Hide":"Show","toggle-btn",()=>toggleProduct(p.id)),btn("حذف","delete-btn",()=>deleteProduct(p.id)));c.appendChild(x)})}
function btn(t,c,f){const b=document.createElement("button");b.textContent=t;b.className=c;b.onclick=f;return b}
function editProduct(id){const ps=getProducts(),p=ps.find(x=>x.id===id);if(!p)return;const n=prompt("اسم القطعة:",p.name);if(n===null)return;const pr=prompt("السعر:",p.price);if(pr===null)return;const d=prompt("الوصف:",p.description||"");if(d===null)return;const s=prompt("المقاسات مفصولة بفاصلة:",p.sizes.join(", "));if(s===null)return;p.name=n.trim()||p.name;p.price=pr.trim()||p.price;p.description=d.trim();p.sizes=s.split(",").map(x=>x.trim()).filter(Boolean);saveProducts(ps);renderProducts();renderAdminProducts()}
function toggleProduct(id){const ps=getProducts(),p=ps.find(x=>x.id===id);if(!p)return;p.visible=p.visible===false;saveProducts(ps);renderProducts();renderAdminProducts()}
function deleteProduct(id){const ps=getProducts(),p=ps.find(x=>x.id===id);if(!p||!confirm(`حذف "${p.name}"؟`))return;saveProducts(ps.filter(x=>x.id!==id));renderProducts();renderAdminProducts()}

function getPortfolio(){try{const x=JSON.parse(localStorage.getItem("kriaa_portfolio")||"[]");return Array.isArray(x)?x:[]}catch{return[]}}
function savePortfolio(x){localStorage.setItem("kriaa_portfolio",JSON.stringify(x))}
async function addPortfolioProject(){if(!isAdmin())return;const name=portfolioName.value.trim(),description=portfolioDescription.value.trim(),url=portfolioUrl.value.trim(),year=portfolioYear.value.trim(),file=portfolioImageFile.files[0];if(!name){alert("أدخل اسم المشروع.");return}let image=portfolioImageUrl.value.trim();if(file)image=await fileToDataURL(file);const ps=getPortfolio();ps.push({id:Date.now(),name,description,url,year,image,visible:true,positionOrder:ps.length+1});savePortfolio(ps);["portfolioName","portfolioDescription","portfolioUrl","portfolioYear","portfolioImageUrl"].forEach(id=>document.getElementById(id).value="");renderPortfolio();renderAdminPortfolio();alert("تمت إضافة المشروع.")}
function renderPortfolio(){const c=document.getElementById("portfolioContainer");if(!c)return;c.innerHTML="";getPortfolio().filter(x=>x.visible!==false).sort((a,b)=>(a.positionOrder||0)-(b.positionOrder||0)).forEach(p=>{const x=document.createElement("article");x.className="portfolio-card";x.innerHTML=`<img src="${escapeHTML(p.image||"")}" alt="${escapeHTML(p.name)}"><div class="portfolio-content"><h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.description||"")}</p>${p.year?`<small>${escapeHTML(p.year)}</small>`:""}${p.url?`<br><a class="visit-btn" href="${escapeHTML(p.url)}" target="_blank" rel="noopener">VISITER LE SITE →</a>`:""}</div>`;c.appendChild(x)})}
function renderAdminPortfolio(){const c=document.getElementById("adminPortfolio");if(!c||!isAdmin())return;c.innerHTML="";getPortfolio().forEach(p=>{const x=document.createElement("div");x.className="admin-portfolio-item";x.innerHTML=`<img src="${escapeHTML(p.image||"")}" alt=""><div><strong>${escapeHTML(p.name)}</strong><br><small>${escapeHTML(p.description||"")}</small></div><div class="admin-actions"></div>`;x.querySelector(".admin-actions").append(btn("Edit","edit-btn",()=>editPortfolio(p.id)),btn(p.visible!==false?"Hide":"Show","toggle-btn",()=>togglePortfolio(p.id)),btn("Delete","delete-btn",()=>deletePortfolio(p.id)));c.appendChild(x)})}
function editPortfolio(id){const ps=getPortfolio(),p=ps.find(x=>x.id===id);if(!p)return;const n=prompt("اسم المشروع:",p.name);if(n===null)return;const d=prompt("الوصف:",p.description||"");if(d===null)return;p.name=n.trim();p.description=d.trim();savePortfolio(ps);renderPortfolio();renderAdminPortfolio()}
function togglePortfolio(id){const ps=getPortfolio(),p=ps.find(x=>x.id===id);if(!p)return;p.visible=p.visible===false;savePortfolio(ps);renderPortfolio();renderAdminPortfolio()}
function deletePortfolio(id){const ps=getPortfolio(),p=ps.find(x=>x.id===id);if(!p||!confirm(`حذف "${p.name}"؟`))return;savePortfolio(ps.filter(x=>x.id!==id));renderPortfolio();renderAdminPortfolio()}

function renderAdminOrders(){const c=document.getElementById("adminOrders");if(!c||!isAdmin())return;const os=getOrders();c.innerHTML="";if(!os.length){c.innerHTML='<p class="admin-note">لا توجد طلبات.</p>';return}os.forEach(o=>{const x=document.createElement("article");x.className="order-admin-card";x.innerHTML=`<div class="order-admin-top"><div><strong>#${o.id}</strong><small>${new Date(o.createdAt).toLocaleString("fr-TN")}</small></div><select><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div><div class="order-admin-details"><div><strong>Article</strong><span>${escapeHTML(o.productName)}</span></div><div><strong>Nom</strong><span>${escapeHTML(o.customerName)}</span></div><div><strong>Taille</strong><span>${escapeHTML(o.size)}</span></div><div><strong>WhatsApp</strong><span>${escapeHTML(o.whatsappNumber)}</span></div><div><strong>Prix</strong><span>${escapeHTML(o.price)} DT</span></div>${o.notes?`<div><strong>Notes</strong><span>${escapeHTML(o.notes)}</span></div>`:""}</div><button class="delete-order-btn">حذف الطلب</button>`;const s=x.querySelector("select");s.value=o.status||"pending";s.onchange=()=>{const a=getOrders(),q=a.find(z=>z.id===o.id);if(q){q.status=s.value;localStorage.setItem("kriaa_orders",JSON.stringify(a))}};x.querySelector(".delete-order-btn").onclick=()=>{if(confirm("حذف الطلب؟")){localStorage.setItem("kriaa_orders",JSON.stringify(getOrders().filter(z=>z.id!==o.id)));renderAdminOrders()}};c.appendChild(x)})}

function getSettings(){try{return JSON.parse(localStorage.getItem("kriaa_settings")||"")}catch{return null}}
function saveSettings(){const sizes=(document.getElementById("defaultSizes").value||"S, M, L, XL, XXL").split(",").map(x=>x.trim()).filter(Boolean);localStorage.setItem("kriaa_settings",JSON.stringify({sizes}));alert("تم حفظ المقاسات.")}
function loadSettings(){const s=getSettings()||{sizes:DEFAULT_SIZES};document.getElementById("defaultSizes").value=s.sizes.join(", ")}
async function changeAdminPassword(){const c=currentAdminPassword.value,n=newAdminPassword.value,v=confirmAdminPassword.value;if(!c||!n||!v){alert("أكمل الحقول.");return}if(n.length<8||n!==v){alert("كلمة السر يجب أن تكون 8 أحرف على الأقل والتأكيد مطابق.");return}await ensureAdminPassword();if(await sha256(c)!==localStorage.getItem("kriaa_admin_password_hash")){alert("كلمة السر الحالية غير صحيحة.");return}localStorage.setItem("kriaa_admin_password_hash",await sha256(n));alert("تم تغيير كلمة السر.")}
const translations={ar:{home:"الرئيسية",shop:"المتجر",portfolio:"PORTE FELY0",login:"تسجيل الدخول",logout:"تسجيل الخروج",heroTitle:"ملابس بتفاصيل مختلفة",heroText:"اكتشف قطع KRIAA بتصاميم بسيطة، فخمة ومميزة.",discover:"اكتشف المتجر →",shopTitle:"المتجر",shopText:"اختر القطعة والمقاس المناسب لك.",portfolioText:"المواقع والتصاميم والمشاريع التي صنعتها KRIAA.",loginTitle:"تسجيل الدخول"},fr:{home:"Accueil",shop:"Boutique",portfolio:"PORTE FELY0",login:"Connexion",logout:"Déconnexion",heroTitle:"Des vêtements aux détails différents",heroText:"Découvrez les pièces KRIAA aux designs élégants.",discover:"Découvrir la boutique →",shopTitle:"Boutique",shopText:"Choisissez votre pièce et votre taille.",portfolioText:"Sites, designs et projets créés par KRIAA.",loginTitle:"Connexion"},en:{home:"Home",shop:"Shop",portfolio:"PORTE FELY0",login:"Login",logout:"Logout",heroTitle:"Clothing with different details",heroText:"Discover KRIAA pieces with clean and elegant designs.",discover:"Discover the shop →",shopTitle:"Shop",shopText:"Choose your piece and your size.",portfolioText:"Websites, designs and projects created by KRIAA.",loginTitle:"Login"}};
function changeLanguage(l){const d=translations[l]||translations.ar;document.querySelectorAll("[data-i18n]").forEach(e=>{if(d[e.dataset.i18n])e.textContent=d[e.dataset.i18n]});document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";localStorage.setItem("kriaa_language",l)}
function escapeHTML(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
document.addEventListener("click",e=>{if(e.target===loginModal)closeLogin();if(e.target===orderModal)closeOrder()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeLogin();closeOrder()}});
document.addEventListener("DOMContentLoaded",async()=>{await ensureAdminPassword();if(!localStorage.getItem("kriaa_products"))saveProducts([]);renderProducts();renderPortfolio();updateLoginUI();loadSettings();const l=localStorage.getItem("kriaa_language")||"ar";languageSelect.value=l;changeLanguage(l)});
