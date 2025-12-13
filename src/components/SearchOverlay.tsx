import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchOverlayProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Simple debounce implementation if hook missing
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const searchProducts = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase.rpc('search_products', {
                    query_text: debouncedQuery
                });

                if (error) throw error;
                setResults(data || []);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        searchProducts();
    }, [debouncedQuery]);

    const handleSelect = (productId: string) => {
        navigate(`/products/${productId}`);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 gap-0 max-w-2xl overflow-hidden bg-background">
                <Command shouldFilter={false} className="h-full border-none rounded-none">
                    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <CommandInput
                            placeholder="Search products..."
                            value={query}
                            onValueChange={setQuery}
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <CommandList className="max-h-[60vh] overflow-y-auto">
                        {!query && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Start typing to search...
                            </div>
                        )}

                        {loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Searching...
                            </div>
                        )}

                        {query && !loading && results.length === 0 && (
                            <CommandEmpty>No results found.</CommandEmpty>
                        )}

                        {results.length > 0 && (
                            <CommandGroup heading="Products">
                                {results.map((product) => (
                                    <CommandItem
                                        key={product.id}
                                        value={product.name}
                                        onSelect={() => handleSelect(product.id)}
                                        className="flex items-center gap-4 p-4 cursor-pointer"
                                    >
                                        <div className="h-12 w-12 rounded border bg-muted overflow-hidden flex-shrink-0">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                                    <Search className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium truncate">{product.name}</h4>
                                            <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                                        </div>
                                        <div className="text-sm font-semibold whitespace-nowrap">
                                            PKR {product.price?.toLocaleString()}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
