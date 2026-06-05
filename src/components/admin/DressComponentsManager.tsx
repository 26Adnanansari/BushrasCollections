import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, GripVertical } from 'lucide-react';

export interface DressComponent {
  name: string;
  price: number | null;
}

interface DressComponentsManagerProps {
  components: DressComponent[];
  onChange: (components: DressComponent[]) => void;
}

export function DressComponentsManager({ components, onChange }: DressComponentsManagerProps) {
  const safeComponents = Array.isArray(components) ? components : [];

  const handleAdd = () => {
    onChange([...safeComponents, { name: '', price: null }]);
  };

  const handleRemove = (index: number) => {
    const newComponents = [...safeComponents];
    newComponents.splice(index, 1);
    onChange(newComponents);
  };

  const handleChange = (index: number, field: keyof DressComponent, value: any) => {
    const newComponents = [...safeComponents];
    newComponents[index] = { ...newComponents[index], [field]: value };
    onChange(newComponents);
  };

  const hasFullSet = safeComponents.some(c => c.name.toLowerCase().includes('full'));
  const allPriced = safeComponents.length > 0 && safeComponents.every(c => c.price !== null);
  const totalSuggestedPrice = safeComponents.reduce((acc, curr) => acc + (curr.price || 0), 0);

  const handleAddFullSet = () => {
    onChange([...safeComponents, { name: 'Full Set', price: allPriced ? totalSuggestedPrice : null }]);
  };

  return (
    <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border">
      <div className="flex justify-between items-center">
        <div>
          <Label className="text-base font-semibold">👗 Dress Components</Label>
          <p className="text-xs text-muted-foreground mt-1">
            First component will be selected by default. Leave price empty for WhatsApp Inquiry.
          </p>
        </div>
        <Button type="button" onClick={handleAdd} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Component
        </Button>
      </div>

      {safeComponents.length > 0 ? (
        <div className="space-y-3">
          {safeComponents.map((comp, index) => (
            <div key={index} className="flex items-center gap-3 bg-background p-3 rounded-lg border">
              <div className="text-muted-foreground cursor-grab hover:text-foreground">
                <GripVertical className="h-4 w-4" />
              </div>
              
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Component Name</Label>
                <Input 
                  placeholder="e.g. Choli, Lehnga, Dupatta, Full Set" 
                  value={comp.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                  className="h-8"
                />
              </div>

              <div className="w-32 space-y-1">
                <Label className="text-xs">Price (PKR)</Label>
                <Input 
                  type="number"
                  placeholder="Leave empty for WA" 
                  value={comp.price === null ? '' : comp.price}
                  onChange={(e) => handleChange(index, 'price', e.target.value ? Number(e.target.value) : null)}
                  className="h-8"
                />
              </div>

              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => handleRemove(index)}
                className="text-destructive hover:bg-destructive/10 mt-5"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {!hasFullSet && safeComponents.length > 1 && (
            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Suggestion: Add a "Full Set" component</p>
                <p className="text-xs text-muted-foreground">
                  {allPriced 
                    ? `Calculated Total: Rs. ${totalSuggestedPrice}` 
                    : "One or more components are on inquiry. Full set will be WhatsApp Inquiry."}
                </p>
              </div>
              <Button type="button" onClick={handleAddFullSet} size="sm" variant="secondary">
                <Plus className="h-4 w-4 mr-1" /> Add Full Set
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 bg-background rounded-lg border border-dashed text-muted-foreground text-sm">
          No components added. This will be a standard product.
        </div>
      )}
    </div>
  );
}
