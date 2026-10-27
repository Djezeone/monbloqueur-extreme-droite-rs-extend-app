export const accounts = [
  { id: "11", username: "CompteTest_A" },
  { id: "12", username: "CompteTest_B" },
  { id: "13", username: "CompteTest_C" },
];

function staticPage(url, owner) {
  const handle = new URL(url).pathname.slice(1),
    account = accounts.find((a) => a.username === handle);
  if (!account)
    return `<a href="/${owner}" data-testid="AppTabBar_Profile_Link">Profil</a><main>Accueil de test</main>`;
  if (handle === "CompteTest_C")
    return `<a href="/${owner}" data-testid="AppTabBar_Profile_Link">Profil</a><main><div data-testid="emptyState">Ce compte n’existe pas</div></main>`;
  const already = handle === "CompteTest_B";
  return `<!doctype html><html><meta charset="utf-8"><body>
 <a href="/${owner}" data-testid="AppTabBar_Profile_Link">Profil</a><main>
 <div data-testid="UserName">Compte de test @${handle}</div>
 <button id="state" data-testid="${account.id}-${already ? "unblock" : "follow"}">${already ? "Bloqué" : "Suivre"}</button>
 <button id="more" data-testid="userActions">Plus</button>
 <div id="menu" role="menu" hidden><button id="action" role="menuitem" data-testid="block">${already ? "Débloquer" : "Bloquer"} @${handle}</button></div>
 <div id="dialog" role="alertdialog" hidden>Bloquer @${handle} ?<button id="confirm" data-testid="confirmationSheetConfirm">Bloquer</button></div></main>
 <script>
 document.getElementById('more').onclick=()=>document.getElementById('menu').hidden=false;
 document.getElementById('action').onclick=()=>{document.getElementById('menu').hidden=true;document.getElementById('dialog').hidden=false;};
 document.getElementById('confirm').onclick=()=>{document.getElementById('dialog').hidden=true;const state=document.getElementById('state');state.dataset.testid='${account.id}-unblock';state.textContent='Bloqué';fetch('/__test__/blocked?username=${handle}');};
 </script></body></html>`;
}

export function sitePage(url, owner = "CompteDeTest") {
  const pages = Object.fromEntries(
    ["home", ...accounts.map((a) => a.username)].map((handle) => [
      "/" + handle,
      staticPage(new URL("/" + handle, url).href, owner),
    ]),
  );
  return (
    staticPage(url, owner) +
    `<script>
    const pages = ${JSON.stringify(pages).replaceAll("<", "\\u003c")};
    addEventListener('popstate', () => {
      const html = pages[location.pathname];
      if (!html) return;
      const next = new DOMParser().parseFromString(html, 'text/html');
      document.querySelector('main').replaceWith(next.querySelector('main'));
      const handle = location.pathname.slice(1);
      const account = ${JSON.stringify(accounts)}.find(a => a.username === handle);
      const more = document.getElementById('more');
      if (!more) return;
      more.onclick = () => document.getElementById('menu').hidden = false;
      document.getElementById('action').onclick = () => {
        document.getElementById('menu').hidden = true;
        document.getElementById('dialog').hidden = false;
      };
      document.getElementById('confirm').onclick = () => {
        document.getElementById('dialog').hidden = true;
        const state = document.getElementById('state');
        state.dataset.testid = account.id + '-unblock'; state.textContent = 'Bloqué';
        fetch('/__test__/blocked?username=' + handle);
      };
    });
  </script>`
  );
}
