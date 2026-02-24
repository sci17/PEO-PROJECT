import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, ShieldAlert, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PEO_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663287743413/CpgVOhcjDPGGHjoF.png";
const PALAWAN_SEAL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663287743413/oGeHgIyriUrjNPuv.png";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Store current path for redirect after login
      sessionStorage.setItem("redirectAfterLogin", location);
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated, location]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check if user is approved
  const userApprovalStatus = (user as any)?.approvalStatus;
  
  if (userApprovalStatus === "pending") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-4 mb-8">
            <img src={PEO_LOGO} alt="PEO Logo" className="h-16 w-16 object-contain" />
            <img src={PALAWAN_SEAL} alt="Palawan Seal" className="h-16 w-16 object-contain" />
          </div>
          
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-xl font-bold">Pending Approval</CardTitle>
              <CardDescription className="text-base">
                Your account is awaiting administrator approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Thank you for registering. An administrator will review your account and grant access shortly.
              </p>
              <p className="text-sm text-muted-foreground">
                You will receive a notification once your account has been approved.
              </p>
              <div className="pt-4 border-t">
                <Button variant="outline" onClick={() => window.location.href = getLoginUrl()}>
                  Sign in with different account
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center mt-6 text-sm text-muted-foreground">
            <p>Questions? Contact your division administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  if (userApprovalStatus === "rejected") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-4 mb-8">
            <img src={PEO_LOGO} alt="PEO Logo" className="h-16 w-16 object-contain" />
            <img src={PALAWAN_SEAL} alt="Palawan Seal" className="h-16 w-16 object-contain" />
          </div>
          
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold">Access Denied</CardTitle>
              <CardDescription className="text-base">
                Your account access has been denied
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your request for access has been reviewed and denied by an administrator.
              </p>
              <p className="text-sm text-muted-foreground">
                If you believe this is an error, please contact your division administrator.
              </p>
              <div className="pt-4 border-t">
                <Button variant="outline" onClick={() => window.location.href = getLoginUrl()}>
                  Sign in with different account
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center mt-6 text-sm text-muted-foreground">
            <p>Questions? Contact your division administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  // Check admin requirement
  if (requireAdmin && user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold">Admin Access Required</CardTitle>
              <CardDescription className="text-base">
                You don't have permission to access this page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                This page requires administrator privileges.
              </p>
              <div className="pt-4 border-t">
                <Button variant="outline" onClick={() => setLocation("/")}>
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // User is authenticated and approved
  return <>{children}</>;
}
