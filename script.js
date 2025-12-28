const buttons = document.querySelectorAll(".task-icon");
const views = document.querySelectorAll(".view");

buttons.forEach(btn => {
  btn.addEventListener("click", () => {

    // sidebar active state
    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // switch full workspace view
    views.forEach(v => v.classList.remove("active"));
    document
      .getElementById(btn.dataset.view)
      .classList.add("active");
  });
});
