import { Button } from "@/components/ui/button";
import { IconShare } from "@tabler/icons-react";
import { toast } from "sonner";

export function SharePageButton({ title }: { title: string }) {
  async function share() {
    const data = { title, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(data.url);
        toast.success("Link berhasil disalin");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Link belum dapat dibagikan");
    }
  }

  return (
    <Button type="button" variant="outline" onClick={() => void share()}>
      <IconShare className="size-4" /> Bagikan
    </Button>
  );
}
