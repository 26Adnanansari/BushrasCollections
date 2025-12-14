import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, Megaphone, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AnalyticsHelp = () => {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Button variant="ghost" className="mb-6" onClick={() => navigate('/admin/analytics')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>

            <div className="mb-8">
                <h1 className="text-4xl font-serif font-bold text-foreground mb-2">
                    Analytics User Guide
                </h1>
                <p className="text-muted-foreground">
                    How to use the new Smart Session & Marketing features.
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" /> Smart Sessions
                        </CardTitle>
                        <CardDescription>Understanding how we count "Visits"</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <h3 className="font-semibold mb-2">The 30-Minute Rule</h3>
                            <p className="text-sm text-muted-foreground">
                                Unlike simple "hit counters", we use intelligent timeouts. If a user visits your site, leaves for lunch, and comes back <strong>35 minutes later</strong>, that counts as <strong>2 Sessions</strong> (but 1 Unique Visitor).
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                This helps you measure <strong>Engagement</strong>. High sessions per visitor means people are coming back frequently!
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Megaphone className="h-5 w-5 text-primary" /> Marketing Campaigns (UTM)
                        </CardTitle>
                        <CardDescription>Tracking your Ads and Social Media</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm">
                            You can track exactly which post brought a customer by adding special "tags" to your links. These are called <strong>UTM Parameters</strong>.
                        </p>

                        <div className="border rounded-md p-4">
                            <h4 className="font-semibold text-sm mb-2">Link Builder Example:</h4>
                            <code className="block bg-black text-white p-3 rounded text-xs overflow-x-auto">
                                https://bushrascollection.com/?utm_source=facebook&utm_campaign=winter_sale
                            </code>
                        </div>

                        <ul className="list-disc pl-5 text-sm space-y-2 text-muted-foreground">
                            <li><strong>utm_source</strong>: Where traffic comes from (e.g., <code>facebook</code>, <code>whatsapp</code>, <code>tiktok</code>).</li>
                            <li><strong>utm_campaign</strong>: The specific promo (e.g., <code>eid_sale</code>, <code>winter_clearance</code>).</li>
                            <li><strong>utm_medium</strong>: The type of link (e.g., <code>cpc</code>, <code>social</code>, <code>story</code>).</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" /> Geographic Intelligence
                        </CardTitle>
                        <CardDescription>Knowing where your customers are</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            We automatically detect the City and Country of every visitor. Use this to determine where to offer free shipping or run targeted ads!
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AnalyticsHelp;
