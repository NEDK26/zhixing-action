const list = document.querySelector('#project-list');
const empty = document.querySelector('#empty');
const errorBox = document.querySelector('#error');
const dialog = document.querySelector('#project-dialog');
const form = document.querySelector('#project-form');
let projects = [];
const el = (tag, className, text) => { const e = document.createElement(tag); if (className) e.className = className; if (text != null) e.textContent = text; return e; };
function showError(message) { errorBox.textContent = message; errorBox.hidden = !message; }
async function save(next) {
  try { const response = await fetch('/api/projects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) }); if (!response.ok) throw Error(); projects = next; showError(''); render(); return true; }
  catch { showError('保存失败，请确认本地服务仍在运行后重试。'); return false; }
}
function render() {
  list.replaceChildren(); empty.hidden = projects.length > 0;
  document.querySelector('#project-count').textContent = `${projects.length} 个想法`;
  for (const project of projects) {
    const card = el('article', 'card'); const head = el('div', 'card-head'); const title = el('h3', '', project.title);
    const count = project.steps.filter(s => s.done).length; const badge = el('span', 'badge', project.steps.length && count === project.steps.length ? '已完成' : count ? '进行中' : '待开始');
    head.append(title, badge); card.append(head); if (project.why) card.append(el('p', 'why', project.why));
    const progress = el('p', 'progress', `${count} / ${project.steps.length} 步完成`); card.append(progress);
    const steps = el('ul', 'steps');
    for (const step of project.steps) {
      const li = el('li'); const label = el('label'); const checkbox = el('input'); checkbox.type = 'checkbox'; checkbox.checked = step.done;
      checkbox.addEventListener('change', () => { checkbox.checked = step.done; void save(projects.map(p => p.id === project.id ? { ...p, steps: p.steps.map(s => s.id === step.id ? { ...s, done: !s.done } : s) } : p)); });
      label.append(checkbox, el('span', step.done ? 'done' : '', step.text)); li.append(label); steps.append(li);
    }
    card.append(steps); const add = el('form', 'add-step'); const input = el('input'); input.placeholder = '添加下一小步'; input.maxLength = 200; input.setAttribute('aria-label', `为${project.title}添加步骤`); const button = el('button', '', '添加'); button.type = 'submit';
    add.append(input, button); add.addEventListener('submit', async event => { event.preventDefault(); const text = input.value.trim(); if (!text) return; await save(projects.map(p => p.id === project.id ? { ...p, steps: [...p.steps, { id: crypto.randomUUID(), text, done: false }] } : p)); }); card.append(add);
    const remove = el('button', 'remove', '删除想法'); remove.type = 'button'; remove.addEventListener('click', () => { if (confirm(`删除“${project.title}”及其步骤？`)) void save(projects.filter(p => p.id !== project.id)); }); card.append(remove); list.append(card);
  }
}
function openDialog() { form.reset(); dialog.showModal(); }
document.querySelector('#new-project').addEventListener('click', openDialog); document.querySelector('#empty-new').addEventListener('click', openDialog); document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
form.addEventListener('submit', async event => { event.preventDefault(); const data = new FormData(form); const title = String(data.get('title')).trim(); const why = String(data.get('why')).trim(); const step = String(data.get('step')).trim(); if (!title) return; const project = { id: crypto.randomUUID(), title, why, steps: step ? [{ id: crypto.randomUUID(), text: step, done: false }] : [] }; if (await save([project, ...projects])) dialog.close(); });
fetch('/api/projects').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(data => { projects = data; render(); }).catch(() => { empty.hidden = true; showError('无法读取数据，请确认本地服务正在运行。'); });
