const SUPABASE_URL = 'https://bwllejombxikwsaefpqj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ulqiDizRsNs9RiSpW71hFg_x0OfhSyC';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
const panel = document.querySelector('#secretPanel');
const backdrop = document.querySelector('#panelBackdrop');
const toast = document.querySelector('#toast');
const reveal = document.querySelector('#secretReveal');
const passwordForm = document.querySelector('#passwordForm');
const passwordInput = document.querySelector('#passwordInput');
const passwordError = document.querySelector('#passwordError');
const passwordGate = document.querySelector('#passwordGate');
const secretContent = document.querySelector('#secretContent');
const secretPassword = '0724';
const secretEditor = document.querySelector('#secretEditor');
const secretEditorInput = document.querySelector('#secretEditorInput');
const secretEditorLabel = document.querySelector('#secretEditorLabel');
let activeSecretId = '';
const defaultSecrets = {
  weather: '我其实很怕打雷，但喜欢听雨。',
  collection: '相册里有 427 张天空，没有一张重复。',
  recent: '最近循环的一首歌：没有名字的海。'
};

function getSecretText(secretId) {
  return localStorage.getItem(`blue-room-secret-${secretId}`) || defaultSecrets[secretId];
}

function openSecretEditor(secretId, title) {
  activeSecretId = secretId;
  secretEditorLabel.textContent = `编辑「${title}」`;
  secretEditorInput.value = getSecretText(secretId);
  secretEditor.hidden = false;
  secretEditorInput.focus();
}
const guestPhotoInput = document.querySelector('#guestPhotoInput');
const guestPhotoGrid = document.querySelector('#guestPhotoGrid');
const guestEmpty = document.querySelector('#guestEmpty');
const guestPhotoCount = document.querySelector('#guestPhotoCount');
let guestPhotoTotal = 0;
const messageForm = document.querySelector('#messageForm');
const messageList = document.querySelector('#messageList');
const messageCount = document.querySelector('#messageCount');
let messageTotal = 1;

async function loadCloudMessages() {
  const { data, error } = await supabaseClient
    .from('guest_messages')
    .select('name, message, created_at')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('无法加载留言:', error.message);
    return;
  }
  messageList.querySelectorAll('.cloud-message').forEach((item) => item.remove());
  data.forEach((item) => appendMessage(item.name, item.message, item.created_at, false));
  messageTotal = data.length + 1;
  messageCount.textContent = `${messageTotal} 条留言`;
}

function appendMessage(name, text, createdAt, showToast) {
  const card = document.createElement('article');
  card.className = 'message-card cloud-message';
  const number = String(messageTotal + 1).padStart(2, '0');
  const date = createdAt ? new Date(createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '今天';
  card.innerHTML = `<span class="message-number">${number}</span><div><strong></strong><p></p></div><time></time>`;
  card.querySelector('strong').textContent = name;
  card.querySelector('p').textContent = text;
  card.querySelector('time').textContent = date;
  messageList.append(card);
  messageTotal += 1;
  messageCount.textContent = `${messageTotal} 条留言`;
  refreshCenterShow();
  if (showToast) {
    toast.textContent = '留言已经保存到云端 ✦';
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2200);
  }
}

async function loadCloudPhotos() {
  const { data, error } = await supabaseClient
    .from('guest_photos')
    .select('file_name, image_url')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('无法加载照片:', error.message);
    return;
  }
  guestPhotoGrid.querySelectorAll('.cloud-photo').forEach((item) => item.remove());
  if (data.length) guestEmpty.hidden = true;
  data.forEach((item) => appendCloudPhoto(item.file_name, item.image_url));
  guestPhotoTotal = data.length;
  guestPhotoCount.textContent = `${guestPhotoTotal} 张照片`;
  updateWaterfallWithCommunityPhotos(data);
}

function updateWaterfallWithCommunityPhotos(photos) {
  if (!photos.length) return;
  const waterfallImages = [...document.querySelectorAll('.waterfall-photo img')];
  waterfallImages.forEach((image, index) => {
    const photo = photos[index % photos.length];
    image.src = photo.image_url;
    image.alt = `大家的照片：${photo.file_name}`;
  });
}

function appendCloudPhoto(fileName, imageUrl) {
  const photo = document.createElement('figure');
  photo.className = 'guest-photo cloud-photo';
  const image = document.createElement('img');
  image.src = imageUrl;
  image.alt = '访客照片';
  const caption = document.createElement('figcaption');
  caption.textContent = fileName;
  photo.append(image, caption);
  photo.addEventListener('click', () => openLightbox(imageUrl, fileName));
  guestPhotoGrid.append(photo);
  refreshCenterShow();
  updateWaterfallWithCommunityPhotos([...document.querySelectorAll('.cloud-photo img')].map((image) => ({ image_url: image.src, file_name: image.alt })));
}
const settingsPanel = document.querySelector('#settingsPanel');
const settingsGate = document.querySelector('#settingsGate');
const settingsContent = document.querySelector('#settingsContent');
const settingsPasswordForm = document.querySelector('#settingsPasswordForm');
const settingsPasswordInput = document.querySelector('#settingsPasswordInput');
const settingsPasswordError = document.querySelector('#settingsPasswordError');
const backgroundLibraryInput = document.querySelector('#backgroundLibraryInput');
const customBackgroundOptions = document.querySelector('#customBackgroundOptions');
const customBackgroundHint = document.querySelector('#customBackgroundHint');
let customBackgrounds = JSON.parse(localStorage.getItem('blue-room-background-library') || '[]');
let galleryPhotoImages = [...document.querySelectorAll('[data-gallery-photo]')];
const galleryMetadataList = document.querySelector('#galleryMetadataList');
const managedMessages = document.querySelector('#managedMessages');
const managedPhotos = document.querySelector('#managedPhotos');
const managedMessageCount = document.querySelector('#managedMessageCount');
const managedPhotoCount = document.querySelector('#managedPhotoCount');
const galleryBulkInput = document.querySelector('#galleryBulkInput');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightboxImage');
const lightboxCaption = document.querySelector('#lightboxCaption');
let customGallery = JSON.parse(localStorage.getItem('blue-room-custom-gallery') || '[]');
const galleryCategories = ['light', 'journey', 'quiet'];
const galleryCategoryLabels = { light: '光线', journey: '路上', quiet: '安静' };
const galleryMetadata = JSON.parse(localStorage.getItem('blue-room-gallery-metadata') || '{}');
const customGalleryCount = document.querySelector('#customGalleryCount');
const featuredPhotoCountInput = document.querySelector('#featuredPhotoCount');
if (!localStorage.getItem('blue-room-featured-count-initialized')) {
  localStorage.setItem('blue-room-featured-count', '10');
  localStorage.setItem('blue-room-featured-count-initialized', '1');
}
let featuredPhotoCount = Number(localStorage.getItem('blue-room-featured-count') || 10);
const defaultGallerySources = [
  'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=88',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=88',
  'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=88',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=88'
];

function ensureGallerySlots(count) {
  const grid = document.querySelector('.gallery-grid');
  const existing = grid.querySelectorAll('[data-gallery-photo]').length;
  for (let id = existing + 1; id <= count; id += 1) {
    const item = document.createElement('article');
    item.className = 'gallery-item';
    item.dataset.category = galleryCategories[(id - 1) % galleryCategories.length];
    item.innerHTML = `<div class="image-wrap"><img data-gallery-photo="${id}" src="${defaultGallerySources[(id - 1) % defaultGallerySources.length]}" alt="第 ${id} 张照片"><span class="image-index">${String(id).padStart(2, '0')}</span></div><div class="item-meta"><h3>照片 ${id}</h3><span>MY ARCHIVE</span></div>`;
    grid.append(item);
  }
  galleryPhotoImages = [...document.querySelectorAll('[data-gallery-photo]')];
}

ensureGallerySlots(Math.min(200, Math.max(20, featuredPhotoCount)));
const centerCard = document.querySelector('.center-card');
const centerMedia = document.querySelector('#centerMedia');
const centerTitle = document.querySelector('#centerTitle');
const centerMeta = document.querySelector('#centerMeta');
let centerShowItems = [];
let centerShowIndex = 0;

function toggleSettings(isOpen) {
  settingsPanel.classList.toggle('open', isOpen);
  backdrop.classList.toggle('open', isOpen);
  settingsPanel.setAttribute('aria-hidden', String(!isOpen));
}

function getStoragePath(imageUrl) {
  const marker = '/storage/v1/object/public/guest-photos/';
  const index = imageUrl.indexOf(marker);
  return index === -1 ? '' : decodeURIComponent(imageUrl.slice(index + marker.length));
}

function renderManagerMessages(rows) {
  managedMessageCount.textContent = `${rows.length} 条`;
  managedMessages.replaceChildren();
  if (!rows.length) {
    managedMessages.innerHTML = '<p class="manager-empty">暂无留言</p>';
    return;
  }
  rows.forEach((row) => {
    const item = document.createElement('div');
    item.className = 'manager-item';
    item.innerHTML = '<div class="manager-item-text"><strong></strong><p></p></div><button class="manager-delete" type="button">删除</button>';
    item.querySelector('strong').textContent = row.name;
    item.querySelector('p').textContent = row.message;
    item.querySelector('button').addEventListener('click', () => deleteMessage(row.id, item));
    managedMessages.append(item);
  });
}

function renderManagerPhotos(rows) {
  managedPhotoCount.textContent = `${rows.length} 张`;
  managedPhotos.replaceChildren();
  if (!rows.length) {
    managedPhotos.innerHTML = '<p class="manager-empty">暂无照片</p>';
    return;
  }
  rows.forEach((row) => {
    const item = document.createElement('div');
    item.className = 'manager-item';
    item.innerHTML = '<div class="manager-item-text"><strong></strong></div><button class="manager-delete" type="button">删除</button>';
    const text = item.querySelector('strong');
    text.innerHTML = '<img alt=""><span></span>';
    text.querySelector('img').src = row.image_url;
    text.querySelector('span').textContent = row.file_name;
    item.querySelector('button').addEventListener('click', () => deletePhoto(row, item));
    managedPhotos.append(item);
  });
}

async function loadManagerContent() {
  const [messagesResult, photosResult] = await Promise.all([
    supabaseClient.from('guest_messages').select('id, name, message').order('created_at', { ascending: false }),
    supabaseClient.from('guest_photos').select('id, file_name, image_url').order('created_at', { ascending: false })
  ]);
  renderManagerMessages(messagesResult.data || []);
  renderManagerPhotos(photosResult.data || []);
}

async function deleteMessage(id, element) {
  if (!window.confirm('确定删除这条留言吗？')) return;
  const { error } = await supabaseClient.from('guest_messages').delete().eq('id', id);
  if (error) { window.alert(`删除失败：${error.message}`); return; }
  element.remove();
  loadCloudMessages();
  loadManagerContent();
}

async function deletePhoto(row, element) {
  if (!window.confirm('确定删除这张照片吗？')) return;
  const { error: recordError } = await supabaseClient.from('guest_photos').delete().eq('id', row.id);
  if (recordError) { window.alert(`删除失败：${recordError.message}`); return; }
  const path = getStoragePath(row.image_url);
  if (path) await supabaseClient.storage.from('guest-photos').remove([path]);
  element.remove();
  loadCloudPhotos();
  loadManagerContent();
}

function applyBackground(value) {
  document.body.style.setProperty('--scene-image', value);
  localStorage.setItem('blue-room-background', value);
  toast.textContent = '背景已经换好了 ✦';
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2200);
}

function renderCustomBackgrounds() {
  customBackgroundOptions.replaceChildren();
  customBackgrounds.forEach((background) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'background-option custom-background-option';
    option.innerHTML = '<img alt=""><span></span>';
    option.querySelector('img').src = background.value;
    option.querySelector('img').alt = background.name;
    option.querySelector('span').textContent = background.name;
    option.addEventListener('click', () => applyBackground(`url('${background.value}')`));
    customBackgroundOptions.append(option);
  });
}

function compressBackground(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const image = new Image();
      image.addEventListener('load', () => {
        const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', .82));
      });
      image.addEventListener('error', reject);
      image.src = reader.result;
    });
    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
  });
}

renderCustomBackgrounds();

const storedBackground = localStorage.getItem('blue-room-background');
if (storedBackground) applyBackground(storedBackground);

galleryPhotoImages.forEach((image) => {
  const storedImage = localStorage.getItem(`blue-room-gallery-${image.dataset.galleryPhoto}`);
  if (storedImage) image.src = storedImage;
  const photoId = image.dataset.galleryPhoto;
  const metadata = galleryMetadata[photoId];
  if (metadata) {
    const item = image.closest('.gallery-item');
    item.dataset.category = metadata.category;
    item.querySelector('h3').textContent = metadata.title;
  }
});

function renderGalleryMetadataManager() {
  galleryMetadataList.replaceChildren();
  galleryPhotoImages.forEach((image) => {
    const id = image.dataset.galleryPhoto;
    const item = image.closest('.gallery-item');
    const row = document.createElement('div');
    row.className = 'gallery-metadata-row';
    row.innerHTML = `<span>${id.padStart(2, '0')}</span><input type="text" maxlength="30" placeholder="照片标题"><select><option value="light">光线</option><option value="journey">路上</option><option value="quiet">安静</option></select>`;
    const titleInput = row.querySelector('input');
    const categorySelect = row.querySelector('select');
    titleInput.value = galleryMetadata[id]?.title || item.querySelector('h3').textContent;
    categorySelect.value = galleryMetadata[id]?.category || item.dataset.category;
    function saveMetadata() {
      const title = titleInput.value.trim() || `照片 ${id}`;
      galleryMetadata[id] = { title, category: categorySelect.value };
      localStorage.setItem('blue-room-gallery-metadata', JSON.stringify(galleryMetadata));
      item.dataset.category = categorySelect.value;
      item.querySelector('h3').textContent = title;
      updateGalleryFilterCounts();
      toast.textContent = `第 ${id} 张照片信息已保存 ✦`;
      toast.classList.add('show');
      window.setTimeout(() => toast.classList.remove('show'), 1800);
    }
    titleInput.addEventListener('change', saveMetadata);
    categorySelect.addEventListener('change', saveMetadata);
    row.append(titleInput, categorySelect);
    galleryMetadataList.append(row);
  });
}

function updateGalleryFilterCounts() {
  const counts = { light: 0, journey: 0, quiet: 0 };
  galleryPhotoImages.forEach((image) => {
    const item = image.closest('.gallery-item');
    if (!item.hidden) counts[item.dataset.category] += 1;
  });
  document.querySelector('[data-filter="all"] b').textContent = featuredPhotoCount;
  galleryCategories.forEach((category) => {
    document.querySelector(`[data-filter="${category}"] b`).textContent = counts[category];
  });
}

function applyFeaturedPhotoCount() {
  featuredPhotoCount = Math.min(200, Math.max(1, Number(featuredPhotoCountInput.value) || 20));
  featuredPhotoCountInput.value = featuredPhotoCount;
  localStorage.setItem('blue-room-featured-count', String(featuredPhotoCount));
  const galleryNote = document.querySelector('.gallery-note');
  if (galleryNote) galleryNote.firstChild.textContent = `${featuredPhotoCount} / 200`;
  galleryPhotoImages.forEach((image, index) => {
    image.closest('.gallery-item').hidden = index >= featuredPhotoCount;
  });
  groupFeaturedPhotos();
  updateGalleryFilterCounts();
}

featuredPhotoCountInput.value = featuredPhotoCount;
featuredPhotoCountInput.addEventListener('change', applyFeaturedPhotoCount);
applyFeaturedPhotoCount();
renderGalleryMetadataManager();
updateGalleryFilterCounts();

function openLightbox(src, caption) {
  lightboxImage.src = src;
  lightboxCaption.textContent = caption || '';
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
}

function renderCustomGallery() {
  const grid = document.querySelector('#customGalleryGrid');
  grid.replaceChildren();
  customGalleryCount.textContent = `${customGallery.length} / 200 张 · 第 21 张起自动向下延伸`;
  for (let groupStart = 0; groupStart < customGallery.length; groupStart += 4) {
    const group = customGallery.slice(groupStart, groupStart + 4);
    const item = document.createElement('article');
    item.className = 'gallery-item custom-gallery-item';
    item.innerHTML = '<div class="image-wrap"></div><div class="item-meta"><h3></h3><span>四格相框</span></div>';
    const imageWrap = item.querySelector('.image-wrap');
    group.forEach((photo) => {
      const image = document.createElement('img');
      image.src = photo.src;
      image.alt = photo.title || '我的照片';
      image.addEventListener('click', (event) => {
        event.stopPropagation();
        openLightbox(photo.src, photo.title || '我的照片');
      });
      imageWrap.append(image);
    });
    item.querySelector('h3').textContent = group[0].title || `相框 ${Math.floor(groupStart / 4) + 1}`;
    item.addEventListener('click', () => openLightbox(group[0].src, group[0].title || '相框预览'));
    grid.append(item);
  }
}

renderCustomGallery();

function refreshCenterShow() {
  centerShowItems = [
    ...customGallery.map((photo) => ({ type: 'photo', src: photo.src, title: photo.title || '我的照片', meta: '主人相框' })),
    ...[...document.querySelectorAll('.cloud-photo img')].map((image) => ({ type: 'photo', src: image.src, title: '访客照片', meta: '公开相框' })),
    ...[...document.querySelectorAll('.cloud-message')].map((card) => ({ type: 'text', title: card.querySelector('strong')?.textContent || '一条留言', meta: card.querySelector('p')?.textContent || '快乐从这里开始' }))
  ];
  if (!centerShowItems.length) {
    centerCard.classList.remove('showing-media');
    centerMedia.hidden = true;
    centerTitle.textContent = '片刻之间';
    centerMeta.textContent = '我们放进去的光和话';
  }
}

function showCenterItem() {
  if (!centerShowItems.length) return;
  const item = centerShowItems[centerShowIndex % centerShowItems.length];
  centerShowIndex += 1;
  centerCard.classList.add('showing-media');
  centerMedia.hidden = item.type !== 'photo';
  if (item.type === 'photo') {
    centerMedia.src = item.src;
    centerMedia.alt = item.title;
  }
  centerTitle.textContent = item.title;
  centerMeta.textContent = item.meta;
}

refreshCenterShow();
window.setInterval(showCenterItem, 4200);

function groupFeaturedPhotos() {
  const grid = document.querySelector('.gallery-grid');
  grid.querySelectorAll('.gallery-frame').forEach((frame) => {
    [...frame.children].forEach((item) => grid.append(item));
    frame.remove();
  });
  const items = [...grid.children].filter((item) => item.classList.contains('gallery-item') && !item.hidden);
  for (let index = 0; index < items.length; index += 4) {
    const frame = document.createElement('div');
    frame.className = 'gallery-frame';
    items.slice(index, index + 4).forEach((item) => frame.append(item));
    grid.append(frame);
  }
}

groupFeaturedPhotos();
document.querySelectorAll('.gallery-item .image-wrap, .guest-photo').forEach((item) => {
  item.addEventListener('click', () => {
    const image = item.querySelector('img');
    if (image) openLightbox(image.src, image.alt);
  });
});
document.querySelector('#lightboxClose').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.querySelector('#settingsTrigger').addEventListener('click', () => toggleSettings(true));
document.querySelector('#closeSettings').addEventListener('click', () => toggleSettings(false));
settingsPasswordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (settingsPasswordInput.value === secretPassword) {
    settingsGate.hidden = true;
    settingsContent.hidden = false;
    settingsPasswordError.classList.remove('show');
    settingsPasswordInput.value = '';
    loadManagerContent();
  } else {
    settingsPasswordError.classList.add('show');
    settingsPasswordInput.select();
  }
});

backgroundLibraryInput.addEventListener('change', async (event) => {
  const files = [...event.target.files].filter((file) => file.type.startsWith('image/'));
  const newBackgrounds = await Promise.all(files.map(async (file) => ({
    name: file.name.replace(/\.[^.]+$/, ''),
    value: await compressBackground(file)
  })));
  customBackgrounds = newBackgrounds.slice(0, 4);
  localStorage.setItem('blue-room-background-library', JSON.stringify(customBackgrounds));
  renderCustomBackgrounds();
  event.target.value = '';
  if (newBackgrounds.length) applyBackground(`url('${newBackgrounds[0].value}')`);
});

document.querySelectorAll('[data-gallery-input]').forEach((input) => {
  input.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const photoId = input.dataset.galleryInput;
      const image = document.querySelector(`[data-gallery-photo="${photoId}"]`);
      if (!image) return;
      image.src = reader.result;
      localStorage.setItem(`blue-room-gallery-${photoId}`, reader.result);
      toast.textContent = `展览照片 ${photoId} 已换好 ✦`;
      toast.classList.add('show');
      window.setTimeout(() => toast.classList.remove('show'), 2200);
    });
    reader.readAsDataURL(file);
    input.value = '';
  });
});

galleryBulkInput.addEventListener('change', (event) => {
  const remaining = Math.max(0, 200 - customGallery.length);
  const files = [...event.target.files].filter((file) => file.type.startsWith('image/')).slice(0, remaining);
  if (event.target.files.length > remaining) {
    toast.textContent = remaining ? `最多再添加 ${remaining} 张照片` : '已经达到 200 张上限';
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2200);
  }
  files.forEach((file) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const title = window.prompt('给这张相框写标题（可以留空）：', file.name.replace(/\.[^.]+$/, ''));
      const photo = { src: reader.result, title: title?.trim() || '我的照片' };
      customGallery.push(photo);
      localStorage.setItem('blue-room-custom-gallery', JSON.stringify(customGallery));
      renderCustomGallery();
    });
    reader.readAsDataURL(file);
  });
  event.target.value = '';
});

const motionStage = document.querySelector('.waterfall-stage');
document.querySelector('.hero').addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch' || !motionStage) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width - .5) * 12;
  const y = ((event.clientY - bounds.top) / bounds.height - .5) * 8;
  document.body.style.setProperty('--scene-x', `${x * -.45}px`);
  document.body.style.setProperty('--scene-y', `${y * -.45}px`);
  motionStage.style.setProperty('--stage-x', `${x}px`);
  motionStage.style.setProperty('--stage-y', `${y}px`);
});
document.querySelector('.hero').addEventListener('pointerleave', () => {
  document.body.style.setProperty('--scene-x', '0px');
  document.body.style.setProperty('--scene-y', '0px');
  if (motionStage) {
    motionStage.style.setProperty('--stage-x', '0px');
    motionStage.style.setProperty('--stage-y', '0px');
  }
});

function togglePanel(isOpen) {
  panel.classList.toggle('open', isOpen);
  backdrop.classList.toggle('open', isOpen);
  panel.setAttribute('aria-hidden', String(!isOpen));
}

document.querySelector('#secretTrigger').addEventListener('click', () => togglePanel(true));
document.querySelector('#closeSecret').addEventListener('click', () => togglePanel(false));
backdrop.addEventListener('click', () => {
  togglePanel(false);
  toggleSettings(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') togglePanel(false);
});

passwordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (passwordInput.value === secretPassword) {
    passwordGate.hidden = true;
    secretContent.hidden = false;
    passwordError.classList.remove('show');
    passwordInput.value = '';
  } else {
    passwordError.classList.add('show');
    passwordInput.select();
  }
});

document.querySelectorAll('.secret-card').forEach((card) => {
  card.addEventListener('click', () => {
    const secretText = getSecretText(card.dataset.secretId);
    reveal.textContent = secretText;
    reveal.classList.remove('revealed');
    requestAnimationFrame(() => reveal.classList.add('revealed'));
    openSecretEditor(card.dataset.secretId, card.querySelector('strong').textContent);
  });
});

secretEditor.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = secretEditorInput.value.trim();
  if (!activeSecretId || !text) return;
  localStorage.setItem(`blue-room-secret-${activeSecretId}`, text);
  reveal.textContent = text;
  secretEditor.hidden = true;
  toast.textContent = '这条秘密已经保存 ✦';
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2200);
});

document.querySelector('#cancelSecretEdit').addEventListener('click', () => {
  secretEditor.hidden = true;
  activeSecretId = '';
});

document.querySelectorAll('.filter').forEach((filter) => {
  filter.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
    filter.classList.add('active');
    const category = filter.dataset.filter;
    document.querySelectorAll('.gallery-item').forEach((item) => {
      item.classList.toggle('hide', category !== 'all' && item.dataset.category !== category);
    });
  });
});

document.querySelector('#shuffleButton').addEventListener('click', () => {
  const stage = document.querySelector('.waterfall-stage');
  stage.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(0deg)' }], { duration: 650, easing: 'ease-out' });
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2200);
});

guestPhotoInput.addEventListener('change', async (event) => {
  const files = [...event.target.files].filter((file) => file.type.startsWith('image/'));
  if (!files.length) return;
  let uploadedCount = 0;
  let failedCount = 0;
  let firstError = '';
  for (const file of files) {
    const filePath = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    const { error: uploadError } = await supabaseClient.storage
      .from('guest-photos')
      .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (uploadError) {
      console.error('照片上传失败:', uploadError.message);
      failedCount += 1;
      firstError ||= uploadError.message;
      continue;
    }
    const { data: publicUrlData } = supabaseClient.storage.from('guest-photos').getPublicUrl(filePath);
    const imageUrl = publicUrlData.publicUrl;
    const { error: recordError } = await supabaseClient.from('guest_photos').insert({ file_name: file.name, image_url: imageUrl });
    if (recordError) {
      console.error('照片记录保存失败:', recordError.message);
      failedCount += 1;
      firstError ||= recordError.message;
      continue;
    }
    appendCloudPhoto(file.name, imageUrl);
    guestPhotoTotal += 1;
    uploadedCount += 1;
  }
  if (uploadedCount > 0) guestEmpty.hidden = true;
  guestPhotoCount.textContent = `${guestPhotoTotal} 张照片`;
  guestPhotoInput.value = '';
  toast.textContent = failedCount
    ? `${uploadedCount} 张成功，${failedCount} 张失败：${firstError}`
    : `已保存 ${uploadedCount} 张照片到云端 ✦`;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2200);
});

messageForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.querySelector('#messageName').value.trim();
  const text = document.querySelector('#messageText').value.trim();
  if (!name || !text) return;
  const { error } = await supabaseClient.from('guest_messages').insert({ name, message: text });
  if (error) {
    console.error('留言保存失败:', error.message);
    toast.textContent = '留言保存失败，请稍后再试';
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2200);
    return;
  }
  appendMessage(name, text, new Date().toISOString(), true);
  messageForm.reset();
});

loadCloudMessages();
loadCloudPhotos();
