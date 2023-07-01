let isEdgeDragNavigating = false;

// const IOS_EDGE_DRAG_NAVIGATION_THRESHOLD = 500;


document.addEventListener('touchstart', () => {
  isEdgeDragNavigating = true;
});

document.addEventListener('touchend', () => {
  isEdgeDragNavigating = false;
});

export function isEdgeDrag() {
  return isEdgeDragNavigating;
}

let currentLocation = location.pathname;

setInterval(function() {
  if (currentLocation !== location.pathname) {
    setTimeout(() => (isEdgeDragNavigating = false), 100);
    currentLocation = location.pathname;
  }
}, 100);
