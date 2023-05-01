let isEdgeDragNavigating = false;

const IOS_EDGE_DRAG_NAVIGATION_THRESHOLD = 25;

const handleTouchStart = (e: any) => {
  if (
    e.touches[0].pageX > IOS_EDGE_DRAG_NAVIGATION_THRESHOLD &&
    e.touches[0].pageX < window.innerWidth - IOS_EDGE_DRAG_NAVIGATION_THRESHOLD
  ) {
    return;
  }

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
    setTimeout(() => (isEdgeDragNavigating = false), 200);
    isEdgeDragNavigating = false;
    currentLocation = location.pathname;
  }
}, 100);
