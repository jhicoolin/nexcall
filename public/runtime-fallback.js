(function () {
  function hasReact(element) {
    try {
      return Object.keys(element).some(function (key) {
        return key.indexOf("__react") === 0;
      });
    } catch {
      return false;
    }
  }

  function buildNotice() {
    var container = document.createElement("div");
    var heading = document.createElement("p");
    var title = document.createElement("p");
    var message = document.createElement("p");
    var actions = document.createElement("div");
    var callLink = document.createElement("a");
    var emailLink = document.createElement("a");
    var dismissButton = document.createElement("button");

    container.id = "nc-js-notice";
    container.className = "nc-js-notice";

    heading.className = "nc-js-notice-eyebrow";
    heading.textContent = "JavaScript blocked";

    title.className = "nc-js-notice-title";
    title.textContent = "Interactive features require JavaScript.";

    message.className = "nc-js-notice-copy";
    message.textContent =
      "In Firefox, click the shield icon in the address bar, turn off Enhanced Tracking Protection for this site, then reload.";

    actions.className = "nc-js-notice-actions";

    callLink.className = "nc-js-notice-primary";
    callLink.href = "tel:+12022006578";
    callLink.textContent = "Call us";

    emailLink.className = "nc-js-notice-secondary";
    emailLink.href = "mailto:nexcall@proton.me";
    emailLink.textContent = "Email";

    dismissButton.className = "nc-js-notice-dismiss";
    dismissButton.type = "button";
    dismissButton.textContent = "Dismiss";
    dismissButton.addEventListener("click", function () {
      container.remove();
    });

    actions.append(callLink, emailLink, dismissButton);
    container.append(heading, title, message, actions);

    return container;
  }

  setTimeout(function () {
    var button = document.querySelector("button");

    if (!button || hasReact(button)) {
      return;
    }

    var scripts = document.querySelectorAll('script[src*="_next/static"]');
    var buildKey = "nc_heal_" + (scripts.length > 0 ? scripts[0].src.slice(-12) : "x");

    if (!sessionStorage.getItem(buildKey)) {
      sessionStorage.setItem(buildKey, "1");
      var locationState = window.location;
      window.location.replace(locationState.pathname + "?_nc=" + Date.now() + (locationState.hash || ""));
      return;
    }

    if (document.getElementById("nc-js-notice")) {
      return;
    }

    document.body.appendChild(buildNotice());
  }, 3000);

  document.addEventListener(
    "click",
    function (event) {
      var target = event.target;
      var button =
        target &&
        target.closest &&
        (target.closest("a[data-fallback-href]") || target.closest("button[data-fallback-href]"));

      if (!button || hasReact(button)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      window.location.href = button.getAttribute("data-fallback-href");
    },
    true
  );
})();
