const KEY = 'productlab-products-v1';
const el = id => document.getElementById(id);
let products = [];
let productStorageAvailable = true;
try { products = []; if (!Array.isArray(products)) throw Error(); } catch { productStorageAvailable = false; alert('Could not read your products. Existing data has not been changed.'); }
let editingId = null;
let draftLogo = '';
let logoReadToken = 0;
async function saveProducts() { try { if (!productStorageAvailable) throw Error(); await window.productLabData.save(KEY, products); return true; } catch { el('product-error').textContent = 'Could not save. Check the cloud status and reload before retrying.'; return false; } }
function renderProducts() {
  const grid = el('product-grid');
  grid.querySelectorAll('.saved-product').forEach(card => card.remove());
  const add = el('add-product');
  for (const product of products) {
    const card = document.createElement('button'); card.type = 'button'; card.className = 'product-card saved-product';
    const icon = document.createElement('span'); icon.className = 'card-icon';
    if (product.logo) { const image = document.createElement('img'); image.src = product.logo; image.alt = ''; icon.append(image); } else icon.textContent = '📦';
    const name = document.createElement('strong'); name.textContent = product.name;
    const details = document.createElement('small'); details.textContent = [product.brand, product.country].filter(Boolean).join(' · ') || 'Open product details';
    card.append(icon, name, details); card.addEventListener('click', async () => editProduct(product.id)); grid.insertBefore(card, add);
  }
}
function editProduct(id = null) {
  const product = products.find(item => item.id === id); editingId = id;
  el('products-view').hidden = true; el('section-view').hidden = true; el('product-form').hidden = false;
  el('product-form').reset(); el('product-error').textContent = '';
  logoReadToken++; draftLogo = product?.logo || ''; el('product-form').querySelector('[type="submit"]').disabled = false; showLogo();
  for (const field of ['name', 'brand', 'country', 'instagram', 'tiktok', 'facebook', 'youtube', 'social']) el('product-' + field).value = product?.[field] || '';
  el('legacy-social-label').hidden = !product?.social;
  el('form-kicker').textContent = product ? 'PRODUCT DETAILS' : 'NEW PRODUCT';
  el('form-title').textContent = product ? 'Edit your product.' : 'Add your product.';
  el('delete-product').hidden = !product; el('product-name').focus();
}
el('add-product').addEventListener('click', async () => editProduct());
function showLogo() {
  const preview = el('logo-preview'); preview.replaceChildren();
  if (draftLogo) { const image = document.createElement('img'); image.src = draftLogo; image.alt = ''; preview.append(image); }
  else preview.textContent = '📦';
  el('remove-logo').hidden = !draftLogo;
}
el('product-logo').addEventListener('change', async event => {
  const file = event.target.files[0]; const token = ++logoReadToken;
  if (!file) return;
  if (!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type) || file.size > 2 * 1024 * 1024) {
    el('product-error').textContent = 'Choose a PNG, JPG, WebP or GIF under 2 MB.'; event.target.value = ''; return;
  }
  const reader = new FileReader();
  el('product-error').textContent = 'Loading image…';
  el('product-form').querySelector('[type="submit"]').disabled = true;
  reader.onload = async () => { if (token !== logoReadToken) return; draftLogo = reader.result; showLogo(); el('product-error').textContent = ''; el('product-form').querySelector('[type="submit"]').disabled = false; };
  reader.onerror = async () => { if (token !== logoReadToken) return; el('product-error').textContent = 'Could not read this image. Please try another.'; el('product-form').querySelector('[type="submit"]').disabled = false; };
  reader.readAsDataURL(file);
});
el('remove-logo').addEventListener('click', async () => { logoReadToken++; draftLogo = ''; el('product-logo').value = ''; el('product-error').textContent = ''; el('product-form').querySelector('[type="submit"]').disabled = false; showLogo(); });
el('back-products').addEventListener('click', showProducts);
el('product-form').addEventListener('submit', async event => {
  event.preventDefault(); const name = el('product-name').value.trim();
  if (!name) { el('product-error').textContent = 'Please enter a product name.'; return; }
  const existing = products.find(item => item.id === editingId);
  const product = { ...existing, id: existing?.id || crypto.randomUUID(), name, logo: draftLogo };
  for (const field of ['brand', 'country', 'instagram', 'tiktok', 'facebook', 'youtube', 'social']) product[field] = el('product-' + field).value.trim();
  const previous = products; products = existing ? products.map(item => item.id === editingId ? product : item) : [...products, product];
  if (await saveProducts()) showProducts(); else products = previous;
});
el('delete-product').addEventListener('click', async () => {
  const product = products.find(item => item.id === editingId); if (!product || !confirm(`Delete ${product.name}?`)) return;
  const previous = products; products = products.filter(item => item.id !== editingId);
  if (await saveProducts()) showProducts(); else products = previous;
});

const SECTION_KEY = 'productlab-custom-sections-v1';
let sections = [];
let sectionStorageAvailable = true;
try { sections = []; if (!Array.isArray(sections)) throw Error(); } catch { sectionStorageAvailable = false; alert('Could not read your custom sections. Existing data has not been changed.'); }
let currentSection = null;
let activeView = 'products';
async function saveSections() { try { if (!sectionStorageAvailable) throw Error(); await window.productLabData.save(SECTION_KEY, sections); return true; } catch { alert('Could not save your sections. Check the cloud status and reload before retrying.'); return false; } }
function renderSections() {
  const container = el('custom-sections'); container.replaceChildren();
  for (const section of sections) {
    const button = document.createElement('button'); button.type = 'button';
    button.className = 'nav-item custom' + (section.id === currentSection ? ' active' : '');
    button.textContent = section.name + ' 📝';
    if (section.id === currentSection) button.setAttribute('aria-current','page');
    button.addEventListener('click', async () => showSection(section.id)); container.append(button);
  }
  el('products-nav').classList.toggle('active', activeView === 'products');
  el('analytics-nav').classList.toggle('active', activeView === 'analytics');
  el('ads-nav').classList.toggle('active', activeView === 'ads');
  el('store-nav').classList.toggle('active', activeView === 'store');
  el('followup-nav').classList.toggle('active', activeView === 'followup');
  el('social-nav').classList.toggle('active', activeView === 'social');
  el('winners-nav').classList.toggle('active', activeView === 'winners');
  el('prompts-nav').classList.toggle('active', activeView === 'prompts');
  for (const [id, view] of [['products-nav','products'], ['analytics-nav','analytics'], ['ads-nav','ads'], ['store-nav','store'], ['followup-nav','followup'], ['social-nav','social'], ['winners-nav','winners'], ['prompts-nav','prompts']]) { if (activeView === view) el(id).setAttribute('aria-current','page'); else el(id).removeAttribute('aria-current'); }
}
function showProducts() { currentSection = null; activeView = 'products'; el('prompts-view').hidden = true; el('winners-view').hidden = true; el('social-view').hidden = true; el('followup-view').hidden = true; el('store-view').hidden = true; el('ads-view').hidden = true; el('analytics-view').hidden = true; el('section-view').hidden = true; el('product-form').hidden = true; el('products-view').hidden = false; renderProducts(); renderSections(); }
function showSection(id) {
  const section = sections.find(s => s.id === id); if (!section) return;
  currentSection = id; activeView = 'custom'; el('prompts-view').hidden = true; el('winners-view').hidden = true; el('social-view').hidden = true; el('followup-view').hidden = true; el('store-view').hidden = true; el('ads-view').hidden = true; el('analytics-view').hidden = true; el('products-view').hidden = true; el('product-form').hidden = true; el('section-view').hidden = false;
  el('section-title').textContent = section.name; el('post-text').value = ''; renderPosts(); renderSections();
}
function renderPosts() {
  const section = sections.find(s => s.id === currentSection); const list = el('post-list'); list.replaceChildren();
  for (const post of section.posts) {
    const item = document.createElement('article'); item.className = 'post';
    const content = document.createElement('div'); content.textContent = post.text;
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'text-button'; remove.textContent = 'Delete post';
    remove.addEventListener('click', async () => { if (!confirm('Delete this post?')) return; const old = section.posts; section.posts = old.filter(p => p.id !== post.id); if (await saveSections()) renderPosts(); else section.posts = old; });
    item.append(content, remove); list.append(item);
  }
}
el('add-section').addEventListener('click', async () => { const name = prompt('Name your new section:'); if (name === null) return; if (!name.trim()) { alert('Please enter a section name.'); return; } const section = {id: crypto.randomUUID(), name: name.trim().slice(0,100), posts: []}; sections.push(section); if (await saveSections()) showSection(section.id); else sections.pop(); });
el('products-nav').addEventListener('click', showProducts);
el('post-form').addEventListener('submit', async event => { event.preventDefault(); const text = el('post-text').value.trim(); if (!text) return; const section = sections.find(s => s.id === currentSection); section.posts.unshift({id: crypto.randomUUID(), text}); if (await saveSections()) { el('post-text').value = ''; renderPosts(); } else section.posts.shift(); });
el('delete-section').addEventListener('click', async () => { const section = sections.find(s => s.id === currentSection); if (!section || !confirm(`Delete ${section.name} and its posts?`)) return; const old = sections; sections = sections.filter(s => s.id !== currentSection); if (await saveSections()) showProducts(); else sections = old; });
renderSections();
renderProducts();

const analyticsFields = ['orders', 'price', 'combined-cost', 'chargebacks', 'chargeback-amount'];
function analyticsTotals() {
  const number = key => Number(el('analytics-' + key).value) || 0;
  el('analytics-total-orders').textContent = number('orders');
  el('analytics-revenue').textContent = '$' + (number('orders') * number('price')).toFixed(2);
  el('analytics-unit-cost').textContent = '$' + number('combined-cost').toFixed(2);
}
function loadAnalytics() {
  const product = products.find(item => item.id === el('analytics-product').value);
  el('analytics-empty').hidden = !!product; el('analytics-form').hidden = !product; el('sales-history').hidden = !product;
  if (!product) return;
  const data = product.analytics || {};
  for (const field of analyticsFields) el('analytics-' + field).value = data[field] ?? '';
  if (data['combined-cost'] == null && (data.cost || data.shipping)) el('analytics-combined-cost').value = ((Number(data.cost) || 0) + (Number(data.shipping) || 0)).toFixed(2);
  renderSales(product);
  el('analytics-message').textContent = ''; analyticsTotals();
}
function showAnalytics() {
  currentSection = null; activeView = 'analytics'; el('prompts-view').hidden = true; el('winners-view').hidden = true; el('social-view').hidden = true; el('followup-view').hidden = true; el('store-view').hidden = true; el('ads-view').hidden = true;
  el('products-view').hidden = true; el('product-form').hidden = true; el('section-view').hidden = true; el('analytics-view').hidden = false;
  const select = el('analytics-product'); const previous = select.value; select.replaceChildren();
  for (const product of products) { const option = document.createElement('option'); option.value = product.id; option.textContent = product.name; select.append(option); }
  if (products.some(product => product.id === previous)) select.value = previous;
  select.hidden = products.length === 0; loadAnalytics(); renderSections();
}
el('analytics-nav').addEventListener('click', showAnalytics);
el('analytics-product').addEventListener('change', loadAnalytics);
el('analytics-form').addEventListener('input', async () => { analyticsTotals(); el('analytics-message').textContent = 'Unsaved changes'; });
el('analytics-form').addEventListener('submit', async event => {
  event.preventDefault(); const product = products.find(item => item.id === el('analytics-product').value); if (!product) return;
  const data = { ...(product.analytics || {}) }; for (const field of analyticsFields) data[field] = el('analytics-' + field).value;
  const previous = product.analytics; product.analytics = data;
  try { if (!productStorageAvailable) throw Error(); await window.productLabData.save(KEY, products); el('analytics-message').textContent = 'Saved'; }
  catch { product.analytics = previous; el('analytics-message').textContent = 'Could not save. Check the cloud status and reload before retrying.'; }
});

let chartMetric = 'sales';
function renderSales(product) {
  const points = [...(product.salesHistory || [])].filter(point => point[chartMetric] != null).sort((a,b) => a.date.localeCompare(b.date));
  const chart = el('sales-chart'), list = el('sales-list'); chart.replaceChildren(); list.replaceChildren();
  el('sales-empty').hidden = points.length > 0;
  chart.setAttribute('aria-label', ({sales:'Total sales',orders:'Orders',traffic:'Store traffic (sessions)'})[chartMetric] + ' by date');
  const max = Math.max(1, ...points.map(point => Math.abs(point[chartMetric])));
  for (const point of points) {
    const amount = point[chartMetric];
    const column = document.createElement('div'); column.className = 'sales-column';
    const value = document.createElement('span'); value.textContent = chartMetric === 'sales' ? '$' + amount.toFixed(2) : amount;
    const bar = document.createElement('div'); bar.className = 'sales-bar'; bar.style.height = (Math.abs(amount) / max * 150) + 'px'; if (amount < 0) bar.classList.add('negative');
    const label = document.createElement('time'); label.textContent = point.date; label.dateTime = point.date;
    column.append(value, bar, label); chart.append(column);
    const item = document.createElement('li'); const description = document.createElement('span'); description.textContent = `${point.date}: ${value.textContent}`;
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'text-button'; remove.textContent = 'Delete';
    remove.addEventListener('click', async () => { if (!confirm(`Delete this ${chartMetric} value for ${point.date}?`)) return; const old = product.salesHistory; product.salesHistory = old.map(p => { if (p.date !== point.date) return p; const copy = {...p}; delete copy[chartMetric]; return copy; }).filter(p => p.sales != null || p.orders != null || p.traffic != null); if (await saveSales(product)) renderSales(product); else product.salesHistory = old; });
    item.append(description, remove); list.append(item);
  }
}
async function saveSales(product) { try { if (!productStorageAvailable) throw Error(); await window.productLabData.save(KEY, products); el('sales-error').textContent = 'Saved'; return true; } catch { el('sales-error').textContent = 'Could not save. Check the cloud status and reload before retrying.'; return false; } }
el('sales-form').addEventListener('submit', async event => {
  event.preventDefault(); const product = products.find(item => item.id === el('analytics-product').value); if (!product) return;
  const date = el('sales-date').value, orders = Number(el('sales-orders').value); if (!date || !Number.isInteger(orders) || orders < 0) return;
  const old = product.salesHistory; const existing = (old || []).find(point => point.date === date) || {date}; product.salesHistory = [...(old || []).filter(point => point.date !== date), {...existing, orders}];
  if (await saveSales(product)) { renderSales(product); event.target.reset(); } else product.salesHistory = old;
});

let csvRows = null, pendingImport = null;
for (const button of document.querySelectorAll('.chart-tab')) button.addEventListener('click', async () => {
  chartMetric = button.dataset.metric;
  document.querySelectorAll('.chart-tab').forEach(item => item.classList.toggle('active', item === button));
  const product = products.find(item => item.id === el('analytics-product').value); if (product) renderSales(product);
});
function parseCSV(text) {
  const rows = []; let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (quoted) { if (c === '"' && text[i+1] === '"') { value += '"'; i++; } else if (c === '"') quoted = false; else value += c; }
    else if (c === '"' && value === '') quoted = true;
    else if (c === ',') { row.push(value); value = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i+1] === '\n') i++; row.push(value); if (row.some(v => v.trim())) rows.push(row); row = []; value = ''; }
    else value += c;
  }
  if (quoted) throw Error('The CSV has an unfinished quoted value.');
  if (value || row.length) { row.push(value); if (row.some(v => v.trim())) rows.push(row); }
  return rows;
}
el('csv-file').addEventListener('change', async event => {
  csvRows = null; pendingImport = null; el('csv-confirm').hidden = true; el('csv-mapping').hidden = true; el('csv-preview').textContent = ''; el('csv-message').textContent = '';
  const file = event.target.files[0]; if (!file) return;
  if (file.size > 5 * 1024 * 1024) { el('csv-message').textContent = 'Choose a CSV under 5 MB.'; return; }
  try { const rows = parseCSV((await file.text()).replace(/^\uFEFF/, '')); if (rows.length < 2) throw Error('The CSV needs a header and at least one data row.'); csvRows = rows; const headers = rows[0];
    for (const id of ['csv-date','csv-value']) { const select = el(id); select.replaceChildren(); headers.forEach((header,index) => { const option = document.createElement('option'); option.value = index; option.textContent = header || `Column ${index + 1}`; select.append(option); }); }
    const dateIndex = headers.findIndex(h => /^(day|date)$/i.test(h.trim())); if (dateIndex >= 0) el('csv-date').value = dateIndex;
    el('csv-mapping').hidden = false;
  } catch (error) { el('csv-message').textContent = error.message; }
});
function clearPreview() { pendingImport = null; el('csv-confirm').hidden = true; el('csv-preview').textContent = ''; }
for (const id of ['csv-date','csv-value','csv-metric']) el(id).addEventListener('change', clearPreview);
el('csv-preview-button').addEventListener('click', async () => {
  clearPreview(); el('csv-message').textContent = ''; if (!csvRows) return;
  const dateIndex = Number(el('csv-date').value), valueIndex = Number(el('csv-value').value), metric = el('csv-metric').value;
  if (dateIndex === valueIndex) { el('csv-message').textContent = 'Choose different date and value columns.'; return; }
  const points = [], seen = new Set();
  for (const [index,row] of csvRows.slice(1).entries()) {
    const date = (row[dateIndex] || '').trim(), raw = (row[valueIndex] || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) { el('csv-message').textContent = `Row ${index + 2}: use dates in YYYY-MM-DD format.`; return; }
    if (!raw || !/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(raw)) { el('csv-message').textContent = `Row ${index + 2}: value must be a number, such as 1250.50.`; return; }
    const amount = Number(raw.replace(/,/g,'')); if (!Number.isFinite(amount) || (metric !== 'sales' && (!Number.isInteger(amount) || amount < 0))) { el('csv-message').textContent = `Row ${index + 2}: orders and sessions must be whole, non-negative numbers.`; return; }
    if (seen.has(date)) { el('csv-message').textContent = `Duplicate date ${date}. Export a report grouped by day.`; return; } seen.add(date); points.push({date, value:amount});
  }
  pendingImport = {metric, points, productId:el('analytics-product').value};
  el('csv-preview').textContent = `${points.length} rows for ${metric}. First: ${points[0].date} = ${points[0].value}. Last: ${points.at(-1).date} = ${points.at(-1).value}. Existing values for matching dates and this metric will be replaced.`;
  el('csv-confirm').hidden = false;
});
el('csv-confirm').addEventListener('click', async () => {
  const product = products.find(item => item.id === el('analytics-product').value); if (!product || !pendingImport || pendingImport.productId !== product.id) { clearPreview(); el('csv-message').textContent = 'Select and preview the file again for this product.'; return; }
  const old = product.salesHistory; const byDate = new Map((old || []).map(point => [point.date, {...point}]));
  for (const point of pendingImport.points) { const existing = byDate.get(point.date) || {date:point.date}; existing[pendingImport.metric] = point.value; byDate.set(point.date, existing); }
  product.salesHistory = [...byDate.values()]; if (await saveSales(product)) { chartMetric = pendingImport.metric; document.querySelectorAll('.chart-tab').forEach(button => button.classList.toggle('active', button.dataset.metric === chartMetric)); renderSales(product); clearPreview(); el('csv-message').textContent = 'Import complete.'; } else product.salesHistory = old;
});

const CAMPAIGN_KEY = 'productlab-campaigns-v1';
let campaigns = [], campaignStorageAvailable = true, currentCampaign = null, editingTest = null;
try { campaigns = []; if (!Array.isArray(campaigns)) throw Error(); } catch { campaignStorageAvailable = false; alert('Could not read campaigns. Existing data has not been changed.'); }
async function saveCampaigns(next) { try { if (!campaignStorageAvailable) throw Error(); await window.productLabData.save(CAMPAIGN_KEY, next); campaigns = next; return true; } catch { alert('Could not save campaigns. Check the cloud status and reload before retrying.'); return false; } }
function showAds() { currentSection = null; activeView = 'ads'; el('prompts-view').hidden = true; el('winners-view').hidden = true; el('social-view').hidden = true; el('followup-view').hidden = true; el('store-view').hidden = true; el('ads-view').hidden = false; el('products-view').hidden = true; el('product-form').hidden = true; el('analytics-view').hidden = true; el('section-view').hidden = true; showCampaigns(); renderSections(); }
function showCampaigns() { currentCampaign = null; el('campaign-overview').hidden = false; el('campaign-detail').hidden = true; el('test-form').hidden = true; renderCampaigns(); }
function renderCampaigns() {
 const grid = el('campaign-grid'); grid.querySelectorAll('.campaign-card').forEach(card => card.remove());
 for (const campaign of campaigns) { const button = document.createElement('button'); button.type = 'button'; button.className = 'product-card saved-product campaign-card';
 const icon = document.createElement('span'); icon.className = 'card-icon'; icon.textContent = '📣'; const title = document.createElement('strong'); title.textContent = campaign.name; const details = document.createElement('small'); details.textContent = `${campaign.tests.length} tests`; button.append(icon,title,details); button.addEventListener('click', async () => showCampaign(campaign.id)); grid.insertBefore(button,el('campaign-add')); }
}
function showCampaign(id) { const campaign = campaigns.find(item => item.id === id); if (!campaign) { showCampaigns(); return; } currentCampaign = id; el('campaign-overview').hidden = true; el('test-form').hidden = true; el('campaign-detail').hidden = false; el('campaign-title').textContent = campaign.name; renderTests(campaign); }
function renderTests(campaign) { const grid = el('test-grid'); grid.querySelectorAll('.test-card').forEach(card => card.remove());
 for (const test of campaign.tests) { const button = document.createElement('button'); button.type = 'button'; button.className = 'product-card saved-product test-card'; const icon = document.createElement('span'); icon.className = 'card-icon'; icon.textContent = '🧪'; const name = document.createElement('strong'); name.textContent = test.name; const status = document.createElement('small'); status.textContent = test.status === 'active' ? '● Active' : '○ Inactive'; button.append(icon,name,status); button.addEventListener('click', async () => openTest(test.id)); grid.insertBefore(button, el('test-add')); }
}
function openTest(id = null) { const campaign = campaigns.find(item => item.id === currentCampaign); if (!campaign) return; const test = campaign.tests.find(item => item.id === id); editingTest = id; el('campaign-detail').hidden = true; el('test-form').hidden = false; el('test-name').value = test?.name || ''; el('test-status').value = test?.status || 'active'; el('test-delete').hidden = !test; el('test-form-title').textContent = test ? 'Edit test.' : 'Add a test.'; el('ads-message').textContent = ''; el('test-name').focus(); }
el('ads-nav').addEventListener('click', showAds);
el('campaign-add').addEventListener('click', async () => { const name = prompt('Campaign name:'); if (name === null) return; if (!name.trim()) { alert('Please enter a campaign name.'); return; } const campaign = {id:crypto.randomUUID(),name:name.trim().slice(0,100),tests:[]}; if (await saveCampaigns([...campaigns,campaign])) showCampaign(campaign.id); });
el('campaign-back').addEventListener('click', showCampaigns);
el('campaign-delete').addEventListener('click', async () => { const campaign = campaigns.find(item => item.id === currentCampaign); if (!campaign || !confirm(`Delete ${campaign.name} and all its tests?`)) return; if (await saveCampaigns(campaigns.filter(item => item.id !== currentCampaign))) showCampaigns(); });
el('test-add').addEventListener('click', async () => openTest());
el('test-back').addEventListener('click', async () => showCampaign(currentCampaign));
el('test-form').addEventListener('submit', async event => { event.preventDefault(); const name = el('test-name').value.trim(); if (!name) { el('ads-message').textContent = 'Please enter a test name.'; return; } const campaign = campaigns.find(item => item.id === currentCampaign); if (!campaign) return; const test = {id: editingTest || crypto.randomUUID(), name, status:el('test-status').value}; const tests = editingTest ? campaign.tests.map(item => item.id === editingTest ? test : item) : [...campaign.tests,test]; const updated = campaigns.map(item => item.id === currentCampaign ? {...item,tests} : item); if (await saveCampaigns(updated)) showCampaign(currentCampaign); });
el('test-delete').addEventListener('click', async () => { const campaign = campaigns.find(item => item.id === currentCampaign); const test = campaign?.tests.find(item => item.id === editingTest); if (!test || !confirm(`Delete ${test.name}?`)) return; const updated = campaigns.map(item => item.id === currentCampaign ? {...item,tests:item.tests.filter(t => t.id !== editingTest)} : item); if (await saveCampaigns(updated)) showCampaign(currentCampaign); });

let storeEditingId = null;
function showStore() { currentSection = null; activeView = 'store'; el('prompts-view').hidden = true; el('winners-view').hidden = true; el('social-view').hidden = true; el('followup-view').hidden = true; el('store-view').hidden = false; el('ads-view').hidden = true; el('products-view').hidden = true; el('product-form').hidden = true; el('analytics-view').hidden = true; el('section-view').hidden = true; el('store-form').hidden = true; renderStore(); renderSections(); }
function renderStore() {
  const list = el('store-list'); list.replaceChildren();
  if (!products.length) { const empty = document.createElement('p'); empty.className = 'analytics-note'; empty.textContent = 'No products yet. Add your first product and store below.'; list.append(empty); return; }
  for (const product of products) {
    const row = document.createElement('article'); row.className = 'store-row'; const info = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = product.name; info.append(title);
    if (product.store && /^https?:\/\//i.test(product.store)) { const link = document.createElement('a'); link.href = product.store; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = product.store; info.append(link); }
    else { const note = document.createElement('small'); note.textContent = product.store ? 'Saved store link needs a valid http or https URL.' : 'No store link yet'; info.append(note); }
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'store-edit'; edit.textContent = product.store ? 'Edit store' : 'Add store'; edit.addEventListener('click', async () => openStoreForm(product.id)); row.append(info, edit); list.append(row);
  }
}
function openStoreForm(id = null) { const product = products.find(item => item.id === id); storeEditingId = id; el('store-form').hidden = false; el('store-form-title').textContent = product ? 'Edit product and store' : 'Add product and store'; el('store-product-name').value = product?.name || ''; el('store-url').value = product?.store || ''; el('store-message').textContent = ''; el('store-product-name').focus(); }
el('store-nav').addEventListener('click', showStore);
el('store-add').addEventListener('click', async () => openStoreForm());
el('store-cancel').addEventListener('click', async () => { el('store-form').hidden = true; });
el('store-form').addEventListener('submit', async event => {
  event.preventDefault(); const name = el('store-product-name').value.trim(), store = el('store-url').value.trim();
  if (!name) { el('store-message').textContent = 'Please enter a product name.'; return; }
  if (store && !/^https?:\/\//i.test(store)) { el('store-message').textContent = 'Use a store link beginning with https:// or http://.'; return; }
  const existing = products.find(item => item.id === storeEditingId); const product = {...existing, id:existing?.id || crypto.randomUUID(), name, store};
  const next = existing ? products.map(item => item.id === storeEditingId ? product : item) : [...products, product];
  try { if (!productStorageAvailable) throw Error(); await window.productLabData.save(KEY, next); products = next; el('store-form').hidden = true; renderStore(); }
  catch { el('store-message').textContent = 'Could not save. Check the cloud status and reload before retrying.'; }
});

const FOLLOWUP_KEY = 'productlab-followup-v1';
let followups = [], followupStorageAvailable = true;
try { followups = []; if (!Array.isArray(followups)) throw Error(); } catch { followupStorageAvailable = false; alert('Could not read product follow-up. Existing data has not been changed.'); }
async function showFollowup() { currentSection = null; activeView = 'followup'; for (const id of ['prompts-view','winners-view','social-view','store-view','ads-view','products-view','product-form','analytics-view','section-view']) el(id).hidden = true; el('followup-view').hidden = false; el('followup-message').textContent = ''; await syncFollowups(); renderFollowups(); renderSections(); }
async function persistFollowups(next) { try { if (!followupStorageAvailable) throw Error(); await window.productLabData.save(FOLLOWUP_KEY, next); followups = next; return true; } catch { el('followup-message').textContent = 'Could not save. Check the cloud status and reload before retrying.'; return false; } }
async function syncFollowups() { const linked = new Set(followups.map(entry => entry.productId).filter(Boolean)); const additions = products.filter(product => !linked.has(product.id)).map(product => ({id:crypto.randomUUID(), productId:product.id, name:product.name, instagram:product.instagram || ''})); const next = [...followups, ...additions].map(entry => { const product = products.find(p => p.id === entry.productId); return product ? {...entry, name:product.name, instagram:product.instagram || ''} : entry; }); if (JSON.stringify(next) !== JSON.stringify(followups)) await persistFollowups(next); }
function renderFollowups(extra = null) { const tbody = el('followup-rows'); tbody.replaceChildren(); for (const entry of [...followups, ...(extra ? [extra] : [])]) addFollowupRow(entry, !!extra && entry.id === extra.id); }
function addFollowupRow(entry, isNew) {
  const row = document.createElement('tr'); const inputs = {};
  for (const [key,label,type] of [['name','Product name','text'],['instagram','Instagram link','url'],['aliexpress','AliExpress link','url'],['price','Product price in dollars','number'],['demand','Market demand rating','select'],['virality','Virality / days','text'],['notes','Demand notes','text']]) {
    const cell = document.createElement('td'); let field;
    if (type === 'select') { field = document.createElement('select'); for (const [value,text] of [['','Choose'],['1','1'],['2','2'],['3','3']]) { const option = document.createElement('option'); option.value = value; option.textContent = text; field.append(option); } }
    else { field = document.createElement('input'); field.type = type; if (type === 'number') { field.min = '0'; field.step = '0.01'; } field.maxLength = 500; }
    if (entry.productId && ['name','instagram'].includes(key)) { field.readOnly = true; field.title = 'Edit this in Products'; } field.setAttribute('aria-label', label); field.value = entry[key] ?? ''; cell.append(field); row.append(cell); inputs[key] = field;
  }
  const actions = document.createElement('td'); actions.className = 'followup-row-actions'; const save = document.createElement('button'); save.type = 'button'; save.textContent = 'Save'; save.className = 'store-edit';
  save.addEventListener('click', async () => { const data = {...entry}; for (const [key,input] of Object.entries(inputs)) { if (!input.reportValidity()) return; data[key] = input.value.trim(); } if (!data.name) { el('followup-message').textContent = 'Enter a product name before saving.'; inputs.name.focus(); return; } const next = isNew ? [...followups,data] : followups.map(item => item.id === entry.id ? data : item); if (await persistFollowups(next)) { el('followup-message').textContent = 'Saved'; renderFollowups(); } });
  const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'text-button'; remove.textContent = isNew ? 'Cancel' : entry.productId ? 'Linked' : 'Delete'; if (entry.productId && !isNew) { remove.disabled = true; remove.title = 'This row is linked to a product'; } remove.addEventListener('click', async () => { if (isNew) { renderFollowups(); return; } if (!confirm(`Delete ${entry.name}?`)) return; if (await persistFollowups(followups.filter(item => item.id !== entry.id))) renderFollowups(); }); actions.append(save,remove); row.append(actions); el('followup-rows').append(row);
}
el('followup-nav').addEventListener('click', showFollowup);
el('followup-add').addEventListener('click', async () => { renderFollowups({id:crypto.randomUUID()}); const rows = el('followup-rows'); rows.lastElementChild?.querySelector('input')?.focus(); });

let socialProductId = null;
function showSocial() { currentSection = null; activeView = 'social'; for (const id of ['prompts-view','winners-view','followup-view','store-view','ads-view','products-view','product-form','analytics-view','section-view']) el(id).hidden = true; el('social-view').hidden = false; el('social-form').hidden = true; renderSocial(); renderSections(); }
function renderSocial() {
 const list = el('social-products'); list.replaceChildren();
 if (!products.length) { const p = document.createElement('p'); p.textContent = 'Add a product first to organise its social accounts.'; p.className = 'analytics-note'; list.append(p); return; }
 for (const product of products) {
  const card = document.createElement('section'); card.className = 'social-product'; const title = document.createElement('h2'); title.textContent = product.name; card.append(title);
  const accounts = [['Instagram',product.instagram],['TikTok',product.tiktok],['Facebook',product.facebook],['YouTube',product.youtube],['Other',product.social]].filter(([,url]) => url).map(([name,url]) => ({name,url,fromProduct:true})).concat(product.socialAccounts || []);
  if (!accounts.length) { const empty = document.createElement('p'); empty.className = 'analytics-note'; empty.textContent = 'No accounts yet.'; card.append(empty); }
  for (const account of accounts) { const row = document.createElement('div'); row.className = 'social-account'; const content = document.createElement('div'); const name = document.createElement('strong'); name.textContent = account.name; content.append(name); if (/^https?:\/\//i.test(account.url)) { const link = document.createElement('a'); link.href = account.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = account.url; content.append(link); } else { const text = document.createElement('small'); text.textContent = account.url; content.append(text); } row.append(content);
   if (!account.fromProduct) { const del = document.createElement('button'); del.type = 'button'; del.className = 'text-button'; del.textContent = 'Delete'; del.addEventListener('click', async () => { if (!confirm(`Delete ${account.name}?`)) return; const next = products.map(item => item.id === product.id ? {...item,socialAccounts:(item.socialAccounts || []).filter(a => a.id !== account.id)} : item); if (await saveSocialProducts(next)) renderSocial(); }); row.append(del); }
   else { const note = document.createElement('small'); note.textContent = 'Edit in Products'; row.append(note); } card.append(row);
  }
  const add = document.createElement('button'); add.type = 'button'; add.className = 'nav-add'; add.textContent = '＋ Add account'; add.addEventListener('click', async () => { socialProductId = product.id; el('social-form-title').textContent = `Add an account for ${product.name}`; el('social-form').reset(); el('social-message').textContent = ''; el('social-form').hidden = false; el('social-form').scrollIntoView({block:'nearest'}); el('social-name').focus(); }); card.append(add); list.append(card);
 }
}
async function saveSocialProducts(next) { try { if (!productStorageAvailable) throw Error(); await window.productLabData.save(KEY, next); products = next; return true; } catch { el('social-message').textContent = 'Could not save. Check the cloud status and reload before retrying.'; alert('Could not save. Check the cloud status and reload before retrying.'); return false; } }
el('social-nav').addEventListener('click', showSocial);
el('social-cancel').addEventListener('click', async () => { el('social-form').hidden = true; });
el('social-form').addEventListener('submit', async event => { event.preventDefault(); const product = products.find(item => item.id === socialProductId); const name = el('social-name').value.trim(), url = el('social-url').value.trim(); if (!product || !name || !/^https?:\/\//i.test(url)) { el('social-message').textContent = 'Enter an account name and a link beginning with https:// or http://.'; return; } const account = {id:crypto.randomUUID(),name,url}; const next = products.map(item => item.id === socialProductId ? {...item,socialAccounts:[...(item.socialAccounts || []),account]} : item); if (await saveSocialProducts(next)) { el('social-form').hidden = true; renderSocial(); } });

const WINNER_KEY = 'productlab-winners-v1';
let winners = [], winnerStorageAvailable = true, winnerEditingId = null;
try { winners = []; if (!Array.isArray(winners)) throw Error(); } catch { winnerStorageAvailable = false; alert('Could not read winner concepts. Existing data has not been changed.'); }
async function saveWinners(next) { try { if (!winnerStorageAvailable) throw Error(); await window.productLabData.save(WINNER_KEY, next); winners = next; return true; } catch { el('winner-error').textContent = 'Could not save. Check the cloud status and reload before retrying.'; return false; } }
function showWinners() { currentSection = null; activeView = 'winners'; for (const id of ['prompts-view','social-view','followup-view','store-view','ads-view','products-view','product-form','analytics-view','section-view']) el(id).hidden = true; el('winners-view').hidden = false; renderWinners(); renderSections(); }
function renderWinners() { for (const type of ['hooks','body','other']) { const list = el('winner-' + type); list.replaceChildren(); const items = winners.filter(item => item.type === type); el('winner-' + type + '-count').textContent = items.length; if (!items.length) { const empty = document.createElement('li'); empty.className = 'winner-empty'; empty.textContent = 'Nothing here yet'; list.append(empty); } for (const item of items) { const li = document.createElement('li'); const button = document.createElement('button'); button.type = 'button'; button.className = 'winner-item'; const name = document.createElement('span'); name.textContent = item.name; const category = document.createElement('small'); category.textContent = item.category || ''; button.append(name,category); button.addEventListener('click', async () => openWinner(item.id)); li.append(button); list.append(li); } } }
function openWinner(id = null) { const item = winners.find(entry => entry.id === id); winnerEditingId = id; el('winner-form').reset(); el('winner-name').value = item?.name || ''; el('winner-category').value = item?.category || ''; el('winner-type').value = item?.type || 'hooks'; el('winner-url').value = item?.url || ''; el('winner-open-link').hidden = !item?.url || !/^https?:\/\//i.test(item.url); if (!el('winner-open-link').hidden) el('winner-open-link').href = item.url; el('winner-delete').hidden = !item; el('winner-error').textContent = ''; el('winner-form-title').textContent = item ? 'Edit concept' : 'Add a concept'; el('winner-dialog').showModal(); el('winner-name').focus(); }
el('winners-nav').addEventListener('click', showWinners);
el('winner-add').addEventListener('click', async () => openWinner());
el('winner-close').addEventListener('click', async () => el('winner-dialog').close());
el('winner-form').addEventListener('submit', async event => { event.preventDefault(); const name = el('winner-name').value.trim(), url = el('winner-url').value.trim(); if (!name) { el('winner-error').textContent = 'Please enter a concept name.'; return; } if (url && !/^https?:\/\//i.test(url)) { el('winner-error').textContent = 'Use a link beginning with https:// or http://.'; return; } const item = {id:winnerEditingId || crypto.randomUUID(),name,category:el('winner-category').value.trim(),type:el('winner-type').value,url}; const next = winnerEditingId ? winners.map(entry => entry.id === winnerEditingId ? item : entry) : [...winners,item]; if (await saveWinners(next)) { el('winner-dialog').close(); renderWinners(); } });
el('winner-delete').addEventListener('click', async () => { const item = winners.find(entry => entry.id === winnerEditingId); if (!item || !confirm(`Delete ${item.name}?`)) return; if (await saveWinners(winners.filter(entry => entry.id !== winnerEditingId))) { el('winner-dialog').close(); renderWinners(); } });

const PROMPT_KEY = 'productlab-prompts-v1';
let prompts = [], promptStorageAvailable = true, promptEditingId = null, promptDraftImages = [], promptReadToken = 0;
try { prompts = []; if (!Array.isArray(prompts)) throw Error(); } catch { promptStorageAvailable = false; alert('Could not read your prompts. Existing data has not been changed.'); }
async function savePrompts(next) { try { if (!promptStorageAvailable) throw Error(); await window.productLabData.save(PROMPT_KEY, next); prompts = next; return true; } catch { el('prompt-error').textContent = 'Could not save. Browser storage may be full; try fewer or smaller screenshots.'; return false; } }
function showPrompts() { currentSection = null; activeView = 'prompts'; for (const id of ['winners-view','social-view','followup-view','store-view','ads-view','products-view','product-form','analytics-view','section-view']) el(id).hidden = true; el('prompts-view').hidden = false; showPromptList(); renderSections(); }
function showPromptList() { promptReadToken++; el('prompt-form').hidden = true; el('prompts-list-view').hidden = false; renderPrompts(); }
function renderPrompts() {
 const list = el('prompts-list'); list.replaceChildren();
 if (!prompts.length) { const p = document.createElement('p'); p.className = 'analytics-note'; p.textContent = 'No prompts yet. Add your first one above.'; list.append(p); }
 for (const prompt of prompts) {
  const post = document.createElement('article'); post.className = 'prompt-post';
  const header = document.createElement('div'); header.className = 'prompt-post-header'; const name = document.createElement('strong'); name.textContent = prompt.name;
  const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'store-edit'; edit.textContent = 'Edit'; edit.addEventListener('click', async () => openPrompt(prompt.id)); header.append(name,edit); post.append(header);
  const images = prompt.images || []; if (images.length) { const gallery = document.createElement('div'); gallery.className = 'prompt-post-images'; for (const image of images) { const img = document.createElement('img'); img.src = image.data; img.alt = image.name || 'Prompt reference image'; gallery.append(img); } post.append(gallery); }
  if (prompt.content) { const text = document.createElement('pre'); text.className = 'prompt-post-text'; text.textContent = prompt.content; post.append(text); const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'back-button prompt-copy'; copy.textContent = 'Copy prompt'; copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(prompt.content); copy.textContent = 'Copied!'; } catch { copy.textContent = 'Select the text to copy'; } }); post.append(copy); }
  list.append(post);
 }
}
function openPrompt(id = null) { const prompt = prompts.find(item => item.id === id); promptEditingId = id; promptReadToken++; promptDraftImages = [...(prompt?.images || [])]; el('prompt-form').reset(); el('prompt-name').value = prompt?.name || ''; el('prompt-content').value = prompt?.content || ''; el('prompt-title').textContent = prompt ? 'Edit prompt.' : 'Add a prompt.'; el('prompt-delete').hidden = !prompt; el('prompt-error').textContent = ''; el('prompt-save').disabled = false; el('prompts-list-view').hidden = true; el('prompt-form').hidden = false; renderPromptImages(); el('prompt-name').focus(); }
function renderPromptImages() { const gallery = el('prompt-gallery'); gallery.replaceChildren(); promptDraftImages.forEach((image,index) => { const figure = document.createElement('figure'); const img = document.createElement('img'); img.src = image.data; img.alt = image.name || 'Screenshot'; const caption = document.createElement('figcaption'); caption.textContent = image.name; const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'text-button'; remove.textContent = 'Remove'; remove.addEventListener('click', async () => { promptDraftImages.splice(index,1); renderPromptImages(); }); figure.append(img,caption,remove); gallery.append(figure); }); }
el('prompts-nav').addEventListener('click', showPrompts);
el('prompt-add').addEventListener('click', async () => openPrompt());
el('prompt-back').addEventListener('click', showPromptList);
el('prompt-images').addEventListener('change', async event => { const files = [...event.target.files]; if (!files.length) return; if (files.some(file => !['image/png','image/jpeg','image/webp','image/gif'].includes(file.type) || file.size > 2*1024*1024)) { el('prompt-error').textContent = 'Choose PNG, JPG, WebP or GIF images under 2 MB each.'; event.target.value = ''; return; } const token = ++promptReadToken; el('prompt-save').disabled = true; el('prompt-error').textContent = 'Loading screenshots…'; try { const images = await Promise.all(files.map(file => new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = async () => resolve({name:file.name,data:reader.result}); reader.onerror = async () => reject(Error()); reader.readAsDataURL(file); }))); if (token !== promptReadToken) return; promptDraftImages.push(...images); renderPromptImages(); el('prompt-error').textContent = ''; } catch { if (token === promptReadToken) el('prompt-error').textContent = 'Could not read the screenshots. Please try again.'; } finally { if (token === promptReadToken) { el('prompt-save').disabled = false; event.target.value = ''; } } });
el('prompt-form').addEventListener('submit', async event => { event.preventDefault(); const name = el('prompt-name').value.trim(); if (!name) { el('prompt-error').textContent = 'Please enter a prompt name.'; return; } const prompt = {id:promptEditingId || crypto.randomUUID(),name,content:el('prompt-content').value,images:[...promptDraftImages]}; const next = promptEditingId ? prompts.map(item => item.id === promptEditingId ? prompt : item) : [...prompts,prompt]; if (await savePrompts(next)) showPromptList(); });
el('prompt-delete').addEventListener('click', async () => { const prompt = prompts.find(item => item.id === promptEditingId); if (!prompt || !confirm(`Delete ${prompt.name} and its screenshots?`)) return; if (await savePrompts(prompts.filter(item => item.id !== promptEditingId))) showPromptList(); });

// Switch the visible workspace before each section handler renders its view.
document.addEventListener('click', async event => {
 const nav = event.target.closest('.workspace-nav button'); if (!nav) return;
 document.querySelectorAll('.workspace-nav .nav-item').forEach(item => { item.classList.remove('active'); item.removeAttribute('aria-current'); });
 nav.classList.add('active'); nav.setAttribute('aria-current','page');
 const targets = {'products-nav':'products-view','analytics-nav':'analytics-view','ads-nav':'ads-view','store-nav':'store-view','followup-nav':'followup-view','social-nav':'social-view','winners-nav':'winners-view','prompts-nav':'prompts-view','chat-nav':'chat-view','workspace-settings-nav':'workspace-settings-view'};
 const target = nav.classList.contains('custom') ? 'section-view' : targets[nav.id]; if (!target) return;
 for (const id of ['products-view','product-form','analytics-view','ads-view','store-view','followup-view','social-view','winners-view','prompts-view','section-view','chat-view','members-view','workspace-settings-view']) { const node=document.getElementById(id); if(node) node.hidden=id!==target; }
}, true);

document.addEventListener('productlab:ready', async()=>{try{await window.productLabData.load(); products=window.productLabData.get(KEY);sections=window.productLabData.get(SECTION_KEY);campaigns=window.productLabData.get(CAMPAIGN_KEY);followups=window.productLabData.get(FOLLOWUP_KEY);winners=window.productLabData.get(WINNER_KEY);prompts=window.productLabData.get(PROMPT_KEY);showProducts();}catch(error){alert('Cloud data could not load: '+error.message);}});
