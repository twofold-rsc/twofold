import { Chrome, hslaStringToHsva, hsvaToHsla } from "@uiw/react-color";
import * as Popover from "@radix-ui/react-popover";

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        className="block aspect-square size-5 rounded border border-slate-950/20"
        style={{
          backgroundColor: value,
        }}
      />

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          sideOffset={8}
          collisionPadding={20}
          className=""
        >
          <Chrome
            showEditableInput={false}
            showEyeDropper={false}
            showTriangle={false}
            color={hslaStringToHsva(value)}
            onChange={(color) => {
              let hsla = hsvaToHsla(color.hsva);
              onChange(
                `hsla(${Math.round(hsla.h)}, ${Math.round(hsla.s)}%, ${Math.round(hsla.l)}%, ${Math.round(hsla.a * 100) / 100})`,
              );
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
