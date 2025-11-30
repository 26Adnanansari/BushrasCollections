import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface AvatarSelectionModalProps {
  open: boolean;
  onSelect: (avatarUrl: string) => void;
  onClose: () => void;
  currentAvatar?: string;
}

// Generate 12 preset avatar URLs using DiceBear API
const generateAvatarOptions = () => {
  const styles = ['avataaars', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'notionists'];
  const seeds = ['Felix', 'Aneka', 'Oliver', 'Zoe', 'Luna', 'Max', 'Bella', 'Charlie', 'Sophie', 'Leo', 'Emma', 'Jack'];
  
  return seeds.map((seed, idx) => ({
    id: seed,
    url: `https://api.dicebear.com/7.x/${styles[idx % styles.length]}/svg?seed=${seed}`,
  }));
};

export const AvatarSelectionModal = ({ open, onSelect, onClose, currentAvatar }: AvatarSelectionModalProps) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || "");
  const [saving, setSaving] = useState(false);
  const avatarOptions = generateAvatarOptions();

  const handleSave = async () => {
    if (!selectedAvatar) return;
    setSaving(true);
    await onSelect(selectedAvatar);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
          <DialogDescription>
            Select an avatar to personalize your profile
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-4">
          {avatarOptions.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setSelectedAvatar(avatar.url)}
              className={`relative rounded-lg border-2 p-2 transition-all hover:scale-105 ${
                selectedAvatar === avatar.url
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage src={avatar.url} alt={avatar.id} />
                <AvatarFallback>{avatar.id[0]}</AvatarFallback>
              </Avatar>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedAvatar || saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Avatar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
