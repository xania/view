export function syntheticEvent(
  eventName: string,
  domEvent: Event,
  currentTarget = domEvent.currentTarget
) {
  const syntaticEvent: any = {
    event: domEvent as any,
    target: domEvent.target,
    currentTarget: currentTarget,
    type: eventName,
  };
  if ('key' in domEvent) {
    syntaticEvent.key = domEvent.key;
  }

  return syntaticEvent;
}
