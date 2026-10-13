'use strict';
const STORAGE_KEY = 'ckr_estoque_web_v2';
let data = loadData();
let editingId = null;
let toastTimer;

function emptyData(){return {version:2,products:[],movements:[]};}
function loadData(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return emptyData();const parsed=JSON.parse(raw);if(!Array.isArray(parsed.products)||!Array.isArray(parsed.movements))return emptyData();return parsed;}catch(e){return emptyData();}}
function saveData(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));renderAll();return true;}catch(e){toast('Não foi possível salvar. Verifique o espaço disponível no navegador.',true);return false;}}
function id(){return (crypto&&crypto.randomUUID)?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`;}
function money(n){return Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(message,error=false){const el=document.getElementById('toast');el.textContent=message;el.classList.toggle('error',error);el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3200);}
function productById(pid){return data.products.find(p=>p.id===pid);}
function recordMovement(type,p,qty,total,details=''){data.movements.unshift({id:id(),type,productId:p.id,productName:p.name,quantity:Number(qty),total:Number(total||0),details,date:new Date().toISOString()});}
function dateText(d){return new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});}
function goTo(name){document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===`panel-${name}`));document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.panel===name));const selected=document.querySelector(`.nav-link[data-panel="${name}"]`);document.getElementById('pageBreadcrumb').textContent=selected?selected.textContent.trim().replace(/\d+$/,'').trim():'Visão geral';document.getElementById('sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});}
document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>goTo(b.dataset.panel)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>goTo(b.dataset.go)));
document.getElementById('mobileMenu').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('closeNotice').addEventListener('click',()=>document.querySelector('.notice').style.display='none');
document.getElementById('todayLabel').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});

function renderAll(){renderStats();renderProducts();renderSelects();renderHistory();renderRecent();}
function renderStats(){
 document.getElementById('totalProdutos').textContent=data.products.length;
 document.getElementById('menuProdutos').textContent=data.products.length;
 document.getElementById('totalUnidades').textContent=data.products.reduce((s,p)=>s+Number(p.stock||0),0);
 document.getElementById('totalVendas').textContent=data.movements.filter(m=>m.type==='venda').length;
 document.getElementById('valorEstoque').textContent=money(data.products.reduce((s,p)=>s+Number(p.stock||0)*Number(p.cost||0),0));
}
function renderProducts(){
 const q=document.getElementById('buscaProduto').value.trim().toLowerCase();
 const items=data.products.filter(p=>p.name.toLowerCase().includes(q)||String(p.code||'').toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 document.getElementById('listaProdutos').innerHTML=items.map(p=>`<tr><td><span class="product-name">${esc(p.name)}</span></td><td>${esc(p.code||'—')}</td><td class="${p.stock<=2?'stock-low':''}">${Number(p.stock)}</td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td><button class="row-action" data-edit="${esc(p.id)}">Editar</button><button class="row-action delete" data-delete="${esc(p.id)}">Excluir</button></td></tr>`).join('');
 document.getElementById('semProdutos').style.display=items.length?'none':'block';
 document.getElementById('produtoSubtitulo').textContent=`${items.length} ${items.length===1?'item encontrado':'itens encontrados'}`;
}
function renderSelects(){
 const options=data.products.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(p=>`<option value="${esc(p.id)}">${esc(p.name)} — estoque: ${Number(p.stock)}</option>`).join('');
 ['entradaProduto','vendaProduto'].forEach(key=>{const el=document.getElementById(key),current=el.value;el.innerHTML='<option value="">Selecione um produto...</option>'+options;if(data.products.some(p=>p.id===current))el.value=current;});
 updateSalePreview();
}
function renderHistory(){
 const filter=document.getElementById('filtroTipo').value;
 const list=data.movements.filter(m=>filter==='todos'||m.type===filter);
 document.getElementById('listaHistorico').innerHTML=list.map(m=>`<tr><td>${esc(dateText(m.date))}</td><td><span class="pill ${m.type}">${m.type==='venda'?'Venda':'Entrada'}</span></td><td><span class="product-name">${esc(m.productName)}</span></td><td>${Number(m.quantity)}</td><td>${money(m.total)}</td><td>${esc(m.details||'—')}</td></tr>`).join('');
 document.getElementById('semHistorico').style.display=list.length?'none':'block';
}
function renderRecent(){
 const list=data.movements.slice(0,5);
 document.getElementById('recentRows').innerHTML=list.map(m=>`<tr><td><span class="pill ${m.type}">${m.type==='venda'?'Venda':'Entrada'}</span></td><td><span class="product-name">${esc(m.productName)}</span></td><td>${m.type==='venda'?'−':'+'}${Number(m.quantity)}</td><td>${money(m.total)}</td><td>${esc(dateText(m.date))}</td></tr>`).join('');
 document.getElementById('recentEmpty').style.display=list.length?'none':'block';
}
function resetProductForm(){editingId=null;document.getElementById('formProduto').reset();document.getElementById('produtoEstoque').disabled=false;document.getElementById('produtoEstoque').title='';document.getElementById('produtoCusto').value='0';document.getElementById('produtoPreco').value='0';document.getElementById('produtoEstoque').value='0';document.getElementById('formProdutoTitulo').textContent='Adicionar produto';document.getElementById('salvarProdutoBtn').textContent='Salvar produto';document.getElementById('cancelarEdicao').hidden=true;}
document.getElementById('formProduto').addEventListener('submit',e=>{
 e.preventDefault();const name=document.getElementById('produtoNome').value.trim(),code=document.getElementById('produtoCodigo').value.trim(),cost=Number(document.getElementById('produtoCusto').value),price=Number(document.getElementById('produtoPreco').value),stock=Number(document.getElementById('produtoEstoque').value);
 if(!name||!Number.isFinite(cost)||!Number.isFinite(price)||cost<0||price<0||!Number.isInteger(stock)||stock<0){toast('Confira os dados informados.',true);return;}
 if(code&&data.products.some(p=>p.id!==editingId&&p.code.toLowerCase()===code.toLowerCase())){toast('Já existe um produto com esse código.',true);return;}
 if(editingId){const p=productById(editingId);if(!p)return;p.name=name;p.code=code;p.cost=cost;p.price=price;toast('Produto atualizado. O estoque foi mantido.');}
 else{const p={id:id(),name,code,cost,price,stock};data.products.push(p);if(stock>0)recordMovement('entrada',p,stock,cost*stock,'Estoque inicial');toast('Produto cadastrado com sucesso.');}
 if(saveData())resetProductForm();
});
document.getElementById('cancelarEdicao').addEventListener('click',resetProductForm);
document.getElementById('listaProdutos').addEventListener('click',e=>{
 const edit=e.target.dataset.edit,del=e.target.dataset.delete;
 if(edit){const p=productById(edit);if(!p)return;editingId=p.id;document.getElementById('produtoNome').value=p.name;document.getElementById('produtoCodigo').value=p.code||'';document.getElementById('produtoCusto').value=p.cost;document.getElementById('produtoPreco').value=p.price;document.getElementById('produtoEstoque').value=p.stock;document.getElementById('produtoEstoque').disabled=true;document.getElementById('formProdutoTitulo').textContent='Editar produto';document.getElementById('salvarProdutoBtn').textContent='Salvar alterações';document.getElementById('cancelarEdicao').hidden=false;document.getElementById('produtoEstoque').title='Para alterar estoque, use Entrada ou Venda.';document.getElementById('formProduto').scrollIntoView({behavior:'smooth',block:'start'});}
 if(del){const p=productById(del);if(!p)return;if(!confirm(`Excluir "${p.name}" do catálogo? O histórico será mantido.`))return;data.products=data.products.filter(x=>x.id!==del);if(editingId===del)resetProductForm();if(saveData())toast('Produto excluído.');}
});
document.getElementById('buscaProduto').addEventListener('input',renderProducts);
document.getElementById('formEntrada').addEventListener('submit',e=>{e.preventDefault();const p=productById(document.getElementById('entradaProduto').value),qty=Number(document.getElementById('entradaQuantidade').value),note=document.getElementById('entradaObs').value.trim();if(!p){toast('Cadastre e selecione um produto primeiro.',true);return;}if(!Number.isInteger(qty)||qty<1){toast('Informe uma quantidade inteira maior que zero.',true);return;}p.stock+=qty;recordMovement('entrada',p,qty,p.cost*qty,note);if(saveData()){e.target.reset();toast('Entrada registrada com sucesso.');}});
function updateSalePreview(){const p=productById(document.getElementById('vendaProduto').value);if(p&&document.activeElement!==document.getElementById('vendaPreco'))document.getElementById('vendaPreco').value=Number(p.price).toFixed(2);const qty=Number(document.getElementById('vendaQuantidade').value||0),price=Number(document.getElementById('vendaPreco').value||0);document.getElementById('totalVendaPreview').textContent=money(qty*price);}
document.getElementById('vendaProduto').addEventListener('change',updateSalePreview);
document.getElementById('vendaQuantidade').addEventListener('input',updateSalePreview);
document.getElementById('vendaPreco').addEventListener('input',updateSalePreview);
document.getElementById('formVenda').addEventListener('submit',e=>{e.preventDefault();const p=productById(document.getElementById('vendaProduto').value),qty=Number(document.getElementById('vendaQuantidade').value),price=Number(document.getElementById('vendaPreco').value),client=document.getElementById('vendaCliente').value.trim(),note=document.getElementById('vendaObs').value.trim();if(!p){toast('Cadastre e selecione um produto primeiro.',true);return;}if(!Number.isInteger(qty)||qty<1){toast('Informe uma quantidade inteira maior que zero.',true);return;}if(qty>p.stock){toast(`Estoque insuficiente. Disponível: ${p.stock}.`,true);return;}if(!Number.isFinite(price)||price<0){toast('Informe um preço válido.',true);return;}p.stock-=qty;recordMovement('venda',p,qty,price*qty,[client?`Cliente: ${client}`:'',note].filter(Boolean).join(' · '));if(saveData()){e.target.reset();updateSalePreview();toast('Venda registrada e estoque atualizado.');}});
document.getElementById('filtroTipo').addEventListener('change',renderHistory);
document.getElementById('limparHistorico').addEventListener('click',()=>{if(!confirm('Apagar o histórico? Os produtos e quantidades em estoque serão mantidos.'))return;data.movements=[];if(saveData())toast('Histórico apagado.');});
document.getElementById('fazerBackup').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({...data,exportedAt:new Date().toISOString()},null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`ckr-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast('Backup exportado. Guarde o arquivo em local seguro.');});
document.getElementById('restaurarBackup').addEventListener('click',async()=>{const file=document.getElementById('arquivoBackup').files[0];if(!file){toast('Escolha um arquivo JSON primeiro.',true);return;}if(!confirm('A restauração vai substituir os dados deste dispositivo. Deseja continuar?'))return;try{const imported=JSON.parse(await file.text());if(!Array.isArray(imported.products)||!Array.isArray(imported.movements))throw Error('Formato');for(const p of imported.products){if(!p.id||!String(p.name||'').trim()||!Number.isFinite(Number(p.stock))||Number(p.stock)<0)throw Error('Produto');}data={version:2,products:imported.products,movements:imported.movements};if(saveData()){document.getElementById('arquivoBackup').value='';resetProductForm();toast('Backup restaurado com sucesso.');}}catch(err){toast('Arquivo inválido ou incompatível com o CKR Web V2.',true);}});
document.getElementById('apagarTudo').addEventListener('click',()=>{if(!confirm('Isso apagará todos os produtos, entradas e vendas deste navegador. Continuar?'))return;if(!confirm('Confirme mais uma vez. Só será possível recuperar com backup.'))return;data=emptyData();if(saveData()){resetProductForm();toast('Dados locais apagados.');}});
renderAll();
