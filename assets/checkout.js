(() => {
  const buy = document.querySelector('#buy');
  const recover = document.querySelector('#recover');
  const message = document.querySelector('#order-status');
  const download = document.querySelector('#zip');
  const storage = 'gothic-cathedral-order';
  let sdk;
  let order;
  let generation = 0;
  try { order = localStorage.getItem(storage); } catch {}
  function remember(id) {
    if (!/^txn_[a-z0-9]{26}$/.test(id || '')) return;
    order = id;
    try { localStorage.setItem(storage,id); } catch {}
  }
  async function check() {
    const run = ++generation;
    download.hidden = true;
    if (!order) {
      message.textContent = 'Öffne die Seite im Browser deines Kaufs. Bei Fragen hilft dir Ronald über das Kontaktformular.';
      return;
    }
    message.textContent = 'Zahlung wird geprüft …';
    const query = '?transaction='+encodeURIComponent(order);
    try {
      for (let i = 0; i < 10; i++) {
        const result = await fetch('/api/order'+query,{cache:'no-store'});
        if (run !== generation) return;
        if (result.status === 200 && (await result.json()).ready) {
          download.href = '/api/download'+query;
          download.hidden = false;
          message.textContent = 'Zahlung bestätigt. Dein Dioramen-Paket steht zum Download bereit.';
          return;
        }
        if (result.status !== 202) break;
        await new Promise(resolve => setTimeout(resolve,3000));
        if (run !== generation) return;
      }
    } catch {}
    message.textContent = 'Download noch nicht verfügbar. Versuche es erneut oder sende uns diese Bestellnummer: '+order;
  }
  function loadCheckout() {
    if (sdk) return sdk;
    sdk = new Promise((resolve,reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.onerror = reject;
      script.onload = () => {
        try {
          Paddle.Initialize({token:'live_f00f057219b942b447b36572119', eventCallback(event) {
            if (event.name === 'checkout.completed') {
              remember(event.data.transaction_id);
              Paddle.Checkout.close();
              document.querySelector('#paket').scrollIntoView();
              check();
            }
            if (event.name === 'checkout.loaded' && !order) remember(event.data.transaction_id);
          }});
          resolve();
        } catch (error) { reject(error); }
      };
      document.head.append(script);
    }).catch(error => { sdk = undefined; throw error; });
    return sdk;
  }
  async function session() {
    const response = await fetch('/api/checkout-session',{method:'POST'});
    if (!response.ok) throw Error();
    return response.json();
  }
  buy.onclick = async () => {
    buy.disabled = true;
    message.textContent = 'Kasse wird geöffnet …';
    try {
      let access = await session();
      if (!access.confirmed) access = await session();
      if (!access.confirmed) throw Error();
      await loadCheckout();
      Paddle.Checkout.open({items:[{priceId:'pri_01m7mh8dhsxcgybhgx4k7jecc4',quantity:1}],customData:{order_binding:access.binding},settings:{locale:'de',displayMode:'overlay'}});
      message.textContent = '';
    } catch {
      message.textContent = 'Die Kasse konnte nicht geöffnet werden. Erlaube Website-Cookies und versuche es erneut.';
    } finally { buy.disabled = false; }
  };
  recover.onclick = check;
})();
