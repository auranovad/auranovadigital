import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

const Admin = () => {
  const tenantStatus = {
    database: "connected",
    api: "healthy",
    cache: "operational",
    cdn: "active",
    lastSync: new Date().toLocaleString()
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
      case "healthy":
      case "operational":
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "connected":
      case "healthy":
      case "operational":
      case "active":
        return "default";
      case "warning":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Monitor your tenant status and system health</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Estado del Tenant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Database</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(tenantStatus.database)}
                    <Badge variant={getStatusVariant(tenantStatus.database)}>
                      {tenantStatus.database}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">API</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(tenantStatus.api)}
                    <Badge variant={getStatusVariant(tenantStatus.api)}>
                      {tenantStatus.api}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Cache</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(tenantStatus.cache)}
                    <Badge variant={getStatusVariant(tenantStatus.cache)}>
                      {tenantStatus.cache}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">CDN</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(tenantStatus.cdn)}
                    <Badge variant={getStatusVariant(tenantStatus.cdn)}>
                      {tenantStatus.cdn}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Last sync: {tenantStatus.lastSync}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                Refresh Status
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                View Logs
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                System Settings
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;