export const accounts = [
  { id: "11", username: "CompteTest_A" },
  { id: "12", username: "CompteTest_B" },
  { id: "13", username: "CompteTest_C" },
];

export const fixtureOwners = {
  CompteDeTest: "1234567890",
  AutreCompte: "9876543210",
  CompteSansCache: "1122334455",
};

function profileMarkup(handle, options) {
  const account = accounts.find((a) => a.username === handle);
  if (!account)
    return '<main data-testid="primaryColumn">Accueil de test</main>';
  if (handle === "CompteTest_C")
    return '<main data-testid="primaryColumn"><div data-testid="emptyState">Ce compte n’existe pas</div></main>';
  const id = options.profileIds?.[handle] || account.id;
  const genericUnblock = options.genericUnblockHandles?.includes(handle);
  const already =
    genericUnblock ||
    handle === "CompteTest_B" ||
    options.blocked?.includes(handle);
  const articleId = options.articleFollowIds?.[handle];
  return `<main data-testid="primaryColumn">
    <div data-testid="UserName">Compte de test @${handle}</div>
    <div data-testid="profileActions">
      <button id="state" data-testid="${genericUnblock ? "unblock" : `${id}-${already ? "unblock" : "follow"}`}">${already ? "Bloqué" : "Suivre"}</button>
      <button id="more" data-testid="userActions">Plus</button>
    </div>
    <div id="menu" role="menu" hidden><button id="action" role="menuitem" data-testid="block">${already ? "Débloquer" : "Bloquer"} @${handle}</button></div>
    <div id="dialog" role="alertdialog" hidden>Bloquer @${handle} ?<button id="confirm" data-testid="confirmationSheetConfirm">Bloquer</button></div>
    ${handle === "CompteTest_A" ? '<div data-testid="emptyState">Aucun post pour le moment.</div>' : ""}
    ${articleId ? `<article><div data-testid="UserCell"><button data-testid="${articleId}-follow">Suivre une suggestion</button></div></article>` : ""}
  </main>`;
}

export function sitePage(url, owner = "CompteDeTest", options = {}) {
  const avatarOrigin = options.avatarOrigin || "https://pbs.twimg.com";
  const avatarId = fixtureOwners[owner] || "1122334455";
  const avatar = `${avatarOrigin}/profile_images/${avatarId}/${owner}_normal.png`;
  const pages = Object.fromEntries(
    ["home", ...accounts.map((a) => a.username)].map((handle) => [
      "/" + handle,
      profileMarkup(handle, options),
    ]),
  );
  const handle = new URL(url).pathname.slice(1);
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>
    <nav>
      <a href="/${owner}" data-testid="AppTabBar_Profile_Link">Profil</a>
      <button data-testid="SideNav_AccountSwitcher_Button"><img width="32" height="32" src="${avatar}" alt="Compte connecté"></button>
    </nav>
    ${profileMarkup(handle, options)}
    <script>
      const pages = ${JSON.stringify(pages).replaceAll("<", "\\u003c")};
      const accounts = ${JSON.stringify(accounts)};
      const owner = ${JSON.stringify(owner)};
      function wire() {
        const handle = location.pathname.slice(1);
        const account = accounts.find(a => a.username === handle);
        const more = document.getElementById('more');
        if (!more) return;
        more.onclick = () => document.getElementById('menu').hidden = false;
        document.getElementById('action').onclick = () => {
          document.getElementById('menu').hidden = true;
          document.getElementById('dialog').hidden = false;
        };
        document.getElementById('confirm').onclick = async () => {
          document.getElementById('dialog').hidden = true;
          await fetch('/__test__/blocked?username=' + handle + '&owner=' + owner);
          const state = document.getElementById('state');
          state.dataset.testid = account.id + '-unblock'; state.textContent = 'Bloqué';
        };
      }
      addEventListener('popstate', () => {
        const html = pages[location.pathname];
        if (!html) return;
        const next = new DOMParser().parseFromString(html, 'text/html');
        document.querySelector('main').replaceWith(next.querySelector('main'));
        wire();
      });
      wire();
    </script>
  </body></html>`;
}
