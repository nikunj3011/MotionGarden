import { sendRenderer } from './renderer-bridge';
import { useEffect, useState, type RefObject } from 'react';
import { Hand, Smartphone } from 'lucide-react';
const key = 'mg:interaction';
function saved() {
  try {
    return localStorage.getItem(key) !== 'off';
  } catch {
    return true;
  }
}
export function useArtInteraction(
  frame: RefObject<HTMLIFrameElement | null>,
  id?: string,
  stage?: RefObject<HTMLDivElement | null>,
) {
  const [enabled, setEnabled] = useState(saved),
    [tilt, setTilt] = useState(false),
    [status, setStatus] = useState('Drag gently to guide the current.');
  useEffect(() => {
    const sync = () => setEnabled(saved());
    window.addEventListener('mg:interaction', sync);
    return () => window.removeEventListener('mg:interaction', sync);
  }, []);
  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    try {
      localStorage.setItem(key, next ? 'on' : 'off');
    } catch {}
    window.dispatchEvent(new Event('mg:interaction'));
  };
  async function enableTilt() {
    if (tilt) {
      setTilt(false);
      setStatus('Tilt off. Drag to guide the current.');
      return;
    }
    if (!isSecureContext) {
      setStatus('Tilt needs HTTPS. Drag still works.');
      return;
    }
    const orientation = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<string>;
    };
    if (!orientation) {
      setStatus('Tilt is unavailable here. Drag still works.');
      return;
    }
    try {
      if (orientation.requestPermission && (await orientation.requestPermission()) !== 'granted') {
        setStatus('Tilt permission declined. Drag still works.');
        return;
      }
      setTilt(true);
      setStatus('Hold comfortably, then tilt gently. Waiting for the sensor…');
    } catch {
      setStatus('Tilt could not start. Drag still works.');
    }
  }
  useEffect(() => {
    if (id !== 'flow-field') return;
    const target = frame.current?.contentWindow;
    const send = (data: unknown) => sendRenderer(target, data),
      reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let pointer = { x: 0, y: 0, strength: 0 },
      gravity = { x: 0, y: 0 },
      baseline: { beta: number; gamma: number } | null = null,
      dragging: number | null = null;
    const publish = () =>
      send({
        type: 'SET_INTERACTION',
        enabled: enabled && !document.hidden && !reduced.matches,
        pointer,
        tilt: gravity,
      });
    const reset = () => {
      pointer.strength = 0;
      gravity = { x: 0, y: 0 };
      baseline = null;
      dragging = null;
      publish();
    };
    const ready = (e: MessageEvent) => {
      if (e.origin === location.origin && e.source === target && e.data?.type === 'READY')
        publish();
    };
    const orient = (e: DeviceOrientationEvent) => {
      if (
        !enabled ||
        !tilt ||
        document.hidden ||
        reduced.matches ||
        e.beta === null ||
        e.gamma === null ||
        !Number.isFinite(e.beta) ||
        !Number.isFinite(e.gamma)
      )
        return;
      if (!baseline) {
        baseline = { beta: e.beta, gamma: e.gamma };
        setStatus('Tilt ready. Move gently to guide the current.');
      }
      const x = Math.max(-1, Math.min(1, (e.gamma - baseline.gamma) / 30)),
        y = Math.max(-1, Math.min(1, (e.beta - baseline.beta) / 30));
      const angle = ((screen.orientation?.angle ?? 0) * Math.PI) / 180;
      gravity = {
        x: Math.max(-1, Math.min(1, x * Math.cos(angle) + y * Math.sin(angle))),
        y: Math.max(-1, Math.min(1, y * Math.cos(angle) - x * Math.sin(angle))),
      };
      publish();
    };
    const node = stage?.current;
    const move = (e: PointerEvent) => {
      if (dragging !== e.pointerId || !node) return;
      const b = frame.current?.getBoundingClientRect();
      if (!b) return;
      pointer = {
        x: Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1)),
        y: Math.max(-1, Math.min(1, ((e.clientY - b.top) / b.height) * 2 - 1)),
        strength: 1,
      };
      publish();
    };
    const down = (e: PointerEvent) => {
      if (
        !enabled ||
        !e.isPrimary ||
        e.button !== 0 ||
        reduced.matches ||
        (e.target as HTMLElement).closest('a,button,input')
      )
        return;
      dragging = e.pointerId;
      node?.setPointerCapture(e.pointerId);
      move(e);
    };
    const up = () => {
      dragging = null;
      pointer.strength = 0;
      publish();
    };
    window.addEventListener('message', ready);
    window.addEventListener('deviceorientation', orient);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
    reduced.addEventListener('change', reset);
    screen.orientation?.addEventListener('change', reset);
    node?.addEventListener('pointerdown', down);
    node?.addEventListener('pointermove', move);
    node?.addEventListener('pointerup', up);
    node?.addEventListener('pointercancel', up);
    node?.addEventListener('lostpointercapture', up);
    publish();
    const timeout = tilt
      ? setTimeout(
          () =>
            setStatus((current) =>
              current.includes('Waiting')
                ? 'No tilt data received. Try a supported phone, or drag.'
                : current,
            ),
          5000,
        )
      : undefined;
    return () => {
      clearTimeout(timeout);
      send({
        type: 'SET_INTERACTION',
        enabled: false,
        pointer: { x: 0, y: 0, strength: 0 },
        tilt: { x: 0, y: 0 },
      });
      window.removeEventListener('message', ready);
      window.removeEventListener('deviceorientation', orient);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
      reduced.removeEventListener('change', reset);
      screen.orientation?.removeEventListener('change', reset);
      node?.removeEventListener('pointerdown', down);
      node?.removeEventListener('pointermove', move);
      node?.removeEventListener('pointerup', up);
      node?.removeEventListener('pointercancel', up);
      node?.removeEventListener('lostpointercapture', up);
    };
  }, [id, enabled, tilt, frame, stage]);
  return { enabled, toggle, tilt, enableTilt, status };
}
export function InteractionControls({
  interaction,
}: {
  interaction: ReturnType<typeof useArtInteraction>;
}) {
  return (
    <div className="interaction-controls" onPointerDown={(e) => e.stopPropagation()}>
      <div>
        <button aria-pressed={interaction.enabled} onClick={interaction.toggle}>
          <Hand size={15} /> Touch + tilt <small>{interaction.enabled ? 'On' : 'Off'}</small>
        </button>
        <button
          disabled={!interaction.enabled}
          aria-pressed={interaction.tilt}
          onClick={interaction.enableTilt}
        >
          <Smartphone size={15} />
          {interaction.tilt ? 'Disable tilt' : 'Enable tilt'}
        </button>
      </div>
      <small role="status">
        {interaction.enabled
          ? interaction.status
          : 'Interaction off. The current flows on its own.'}
      </small>
    </div>
  );
}
