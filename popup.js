const api = globalThis.browser ?? globalThis.chrome;
const defaults = { enabled: true, hideHome: false, disableStories: false };

const powerButton = document.querySelector("#powerButton");
const settingsGroup = document.querySelector("#settingsGroup");
const checkboxes = document.querySelectorAll("input[type=checkbox][data-setting]");

const updateControls = (on) => {
  powerButton.classList.toggle("on", on);
  powerButton.setAttribute("aria-checked", String(on));
  settingsGroup.classList.toggle("disabled", !on);
  checkboxes.forEach((el) => {
    el.disabled = !on;
  });
};

api.storage.sync.get(defaults).then((data) => {
  updateControls(data.enabled);
  checkboxes.forEach((el) => {
    el.checked = data[el.dataset.setting];
  });
});

powerButton.addEventListener("click", () => {
  const enabled = powerButton.getAttribute("aria-checked") !== "true";
  updateControls(enabled);
  api.storage.sync.set({ enabled });
});

checkboxes.forEach((el) => {
  el.addEventListener("change", () => {
    api.storage.sync.set({ [el.dataset.setting]: el.checked });
  });
});
