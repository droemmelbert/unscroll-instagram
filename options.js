// Select all checkboxes that have a data-setting attribute
const checkboxes = document.querySelectorAll("input[type=checkbox][data-setting]");

/**
 * Initialize each checkbox: load saved value and set up change listener.
 */
checkboxes.forEach((checkbox) => {
  const key = checkbox.dataset.setting;

  // Load saved value from browser storage
  browser.storage.sync.get(key).then((data) => {
    checkbox.checked = data[key] || false;
  });

  // Save value whenever checkbox changes
  checkbox.addEventListener("change", () => {
    browser.storage.sync.set({ [key]: checkbox.checked });
  });
});
