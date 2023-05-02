let isEdgeDragNavigating = false;

// const IOS_EDGE_DRAG_NAVIGATION_THRESHOLD = 500;

const handleTouchStart = (e: any) => {
  isEdgeDragNavigating = true;
};

document.addEventListener('touchstart', handleTouchStart);
// document.addEventListener('touchend', handleTouchEnd);

export function isEdgeDrag() {
  return isEdgeDragNavigating;
}

let currentLocation = location.pathname;
setInterval(function () {
  if (currentLocation !== location.pathname) {
    setTimeout(() => (isEdgeDragNavigating = false), 100);
    currentLocation = location.pathname;
  }
}, 100);
