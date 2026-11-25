import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fileUrl } from "@/lib/api";
import { useJournal } from "@/context/JournalContext";

export default function LightboxDialog() {
  const { lightbox, setLightbox } = useJournal();
  return (
    <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
      <DialogContent className="max-w-4xl p-3" data-testid="screenshot-lightbox">
        <DialogHeader className="sr-only">
          <DialogTitle>Trade screenshot</DialogTitle>
        </DialogHeader>
        {lightbox && (
          <img src={fileUrl(lightbox)} alt="Trade chart" className="w-full rounded-lg" data-testid="lightbox-image" />
        )}
      </DialogContent>
    </Dialog>
  );
}
