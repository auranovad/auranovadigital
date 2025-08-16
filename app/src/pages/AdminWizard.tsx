import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Settings, CheckCircle } from "lucide-react";

const AdminWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    tenantName: "",
    adminEmail: "",
    companyName: "",
    region: "us-east-1"
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="tenantName">Tenant Name</Label>
              <Input
                id="tenantName"
                placeholder="Enter your tenant name"
                value={formData.tenantName}
                onChange={(e) => handleInputChange("tenantName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@company.com"
                value={formData.adminEmail}
                onChange={(e) => handleInputChange("adminEmail", e.target.value)}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Your Company Name"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <select
                id="region"
                className="w-full p-2 border border-input rounded-md"
                value={formData.region}
                onChange={(e) => handleInputChange("region", e.target.value)}
              >
                <option value="us-east-1">US East (N. Virginia)</option>
                <option value="us-west-2">US West (Oregon)</option>
                <option value="eu-west-1">Europe (Ireland)</option>
                <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
              </select>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuration Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tenant:</span>
                <span>{formData.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Admin Email:</span>
                <span>{formData.adminEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company:</span>
                <span>{formData.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Region:</span>
                <span>{formData.region}</span>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Setup Complete!</h3>
            <p className="text-muted-foreground">
              Your tenant has been configured successfully. You can now start using the admin panel.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <Settings className="h-8 w-8" />
            Setup Wizard
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your tenant settings step by step
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step {currentStep} of {totalSteps}</CardTitle>
            <Progress value={progress} className="w-full" />
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStep()}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="flex items-center gap-2"
                  onClick={() => {
                    // In real implementation, this would save the configuration
                    console.log("Configuration saved:", formData);
                  }}
                >
                  <CheckCircle className="h-4 w-4" />
                  Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminWizard;