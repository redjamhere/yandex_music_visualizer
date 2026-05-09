const saveBtn = document.getElementById('save');
const styleSelect = document.getElementById('visStyle');

// Сохраняем выбор
saveBtn.onclick = () => {
  chrome.storage.local.set({ selectedStyle: styleSelect.value }, () => {
    alert('Стиль сохранен! Обновите страницу музыки.');
  });
};

// Загружаем текущий выбор при открытии
chrome.storage.local.get('selectedStyle', (data) => {
  if (data.selectedStyle) styleSelect.value = data.selectedStyle;
});