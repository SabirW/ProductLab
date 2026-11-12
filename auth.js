(() => {
  const gate = document.getElementById('auth-gate');
  const message = document.getElementById('auth-message');
  const config = window.PRODUCTLAB_SUPABASE;
  const validConfig = config && /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url) && config.publishableKey && !config.publishableKey.includes('PASTE_');
  if (!validConfig || !window.supabase?.createClient) { message.textContent = 'Supabase is not configured. Check config.local.js and your internet connection.'; return; }
  const client = window.supabase.createClient(config.url, config.publishableKey);
  window.productLabSupabase = client;
  const show = (text, error=false) => { message.textContent = text; message.style.color = error ? '#b45045' : ''; };
  async function enterApp(session) {
    if (!session) { gate.hidden = false; return; }
    show('Checking your workspace…');
    const {data: memberships, error} = await client.from('workspace_members').select('workspace_id').limit(2);
    if (error) { show('Signed in, but workspace setup could not load: ' + error.message, true); return; }
    if (!memberships?.length) { document.getElementById('auth-form-view').hidden = true; document.getElementById('workspace-setup').hidden = false; gate.hidden = false; return; }
    window.productLabWorkspaceId = memberships[0].workspace_id;
    gate.hidden = true;
    let user = document.querySelector('.app-user');
    if (!user) { user = document.createElement('div'); user.className = 'app-user'; user.innerHTML = '<button type="button" class="profile-shortcut">My profile 👤</button><button type="button">Sign out</button>'; document.getElementById('app-header').append(user); user.querySelector('.profile-shortcut').addEventListener('click', () => document.dispatchEvent(new Event('productlab:open-profile'))); user.querySelector('button:last-child').addEventListener('click', async () => { await client.auth.signOut(); location.reload(); }); }
    document.dispatchEvent(new Event('productlab:ready'));
  }
  document.getElementById('auth-form').addEventListener('submit', async event => {
    event.preventDefault(); const email = document.getElementById('auth-email').value.trim(), password = document.getElementById('auth-password').value;
    const {data,error} = await client.auth.signInWithPassword({email,password});
    if (error) { show(error.message,true); return; } show(''); await enterApp(data.session);
  });
  document.getElementById('sign-up').addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value.trim(), password = document.getElementById('auth-password').value;
    if (!email || password.length < 8) { show('Enter an email and a password with at least 8 characters.',true); return; }
    const {data,error} = await client.auth.signUp({email,password});
    if (error) { show(error.message,true); return; }
    if (!data.session) { show('Check your email to confirm the account, then sign in.'); return; }
    show('Account created.'); await enterApp(data.session);
  });
  document.getElementById('create-workspace-form').addEventListener('submit', async event => {
    event.preventDefault(); const name = document.getElementById('workspace-name').value.trim();
    const {data,error} = await client.rpc('create_workspace',{workspace_name:name});
    if (error) { show(error.message,true); return; }
    const result = data?.[0]; if (!result) { show('Workspace created, but no invite code was returned.',true); return; }
    window.productLabWorkspaceId = result.workspace_id;
    show('Workspace created. Save this invite code and share it with your two friends: ' + result.invite_code);
    const button = document.createElement('button'); button.className = 'primary'; button.textContent = 'Open ProductLab'; button.addEventListener('click', () => location.reload()); event.target.replaceWith(button);
  });
  document.getElementById('join-workspace-form').addEventListener('submit', async event => {
    event.preventDefault(); const raw = document.getElementById('invite-code').value.trim();
    const {error} = await client.rpc('join_workspace',{code:raw});
    if (error) { show(error.message,true); return; } location.reload();
  });
  client.auth.onAuthStateChange((_event, session) => { if (!session) gate.hidden = false; });
  client.auth.getSession().then(({data,error}) => { if (error) show(error.message,true); else enterApp(data.session); });
})();
