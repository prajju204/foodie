import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

export default function Reports() {
  const handleDownloadReport = (reportType: string) => {
    toast.info(`Downloading ${reportType} report...`);
    // Report generation functionality to be implemented
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate and download business reports
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Report</CardTitle>
              <CardDescription>
                Complete order history with customer details and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => handleDownloadReport("Order")}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Order Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Report</CardTitle>
              <CardDescription>
                Financial overview with revenue breakdown by period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => handleDownloadReport("Revenue")}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Revenue Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Report</CardTitle>
              <CardDescription>
                Stock levels, low stock alerts, and reorder recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => handleDownloadReport("Inventory")}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Inventory Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Report</CardTitle>
              <CardDescription>
                Customer database with order history and contact info
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => handleDownloadReport("Customer")}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Customer Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
