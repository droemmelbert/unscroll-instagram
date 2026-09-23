const defaults = {
  enabled: true,
  hideHome: false,
  disableStories: false
};

const powerButton = document.querySelector("#powerButton");
const settingsGroup = document.querySelector("#settingsGroup");
const checkboxes = document.querySelectorAll("input[type=checkbox][data-setting]");

const updateControls = (enabled) => {
  powerButton.classList.toggle("on", enabled);
  powerButton.setAttribute("aria-checked", String(enabled));
  settingsGroup.classList.toggle("disabled", !enabled);
  checkboxes.forEach((checkbox) => {
    checkbox.disabled = !enabled;
  });
};

browser.storage.sync.get(["enabled", "hideHome", "disableStories"]).then((data) => {
  const enabled = data.enabled ?? defaults.enabled;
  updateControls(enabled);

  checkboxes.forEach((checkbox) => {
    const key = checkbox.dataset.setting;
    checkbox.checked = data[key] ?? defaults[key];
  });
});

powerButton.addEventListener("click", () => {
  const enabled = powerButton.getAttribute("aria-checked") !== "true";
  updateControls(enabled);
  browser.storage.sync.set({ enabled });
});

checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    browser.storage.sync.set({ [checkbox.dataset.setting]: checkbox.checked });
  });
});
