
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser } from "@/firebase";
import {
  initiateAnonymousSignIn,
  initiateEmailSignUp,
  initiateEmailSignIn,
} from "@/firebase/non-blocking-login";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FirebaseError } from "firebase/app";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const handleAuthError = (error: FirebaseError) => {
    setIsLoading(false);
    let title = "An error occurred";
    let description = "Please try again.";

    switch (error.code) {
      case "auth/invalid-email":
        title = "Invalid Email";
        description = "Please enter a valid email address.";
        setAuthError(description);
        break;
      case "auth/user-not-found":
      case "auth/invalid-credential":
        description = "No account found with this email and password combination.";
        setAuthError(description);
        // We set the state, so no need for a toast here.
        return; 
      case "auth/wrong-password":
        title = "Incorrect Password";
        description = "The password you entered is incorrect.";
        setAuthError(description);
        break;
      case "auth/email-already-in-use":
        title = "Email In Use";
        description = "This email is already associated with an account.";
        setAuthError(description);
        break;
      case "auth/weak-password":
        title = "Weak Password";
        description = "Password should be at least 6 characters long.";
        setAuthError(description);
        break;
      default:
        title = "Authentication Error";
        description = error.message;
        setAuthError(description);
        break;
    }
    toast({ variant: "destructive", title, description });
  };
  
  const clearState = () => {
    setAuthError(null);
    setEmail("");
    setPassword("");
  }

  const handleLogin = () => {
    setIsLoading(true);
    setAuthError(null);
    if (auth) {
      initiateEmailSignIn(auth, email, password, handleAuthError).finally(() => {
        // isLoading is handled in handleAuthError on failure
      });
    } else {
        setIsLoading(false);
    }
  };

  const handleSignup = () => {
    setIsLoading(true);
    setAuthError(null);
    if (auth) {
      initiateEmailSignUp(auth, email, password, handleAuthError).finally(() => {
        // isLoading is handled in handleAuthError on failure
      });
    } else {
        setIsLoading(false);
    }
  };

  const handleAnonymousLogin = () => {
    setIsLoading(true);
    setAuthError(null);
    initiateAnonymousSignIn(auth, handleAuthError);
  };
  
  if (isUserLoading || user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full" onValueChange={clearState}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                  Enter your credentials to access your budget.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {authError && (
                    <p className="text-sm font-medium text-destructive">{authError}</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button onClick={handleLogin} disabled={isLoading} className="w-full">
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>
                  Create an account to start managing your budget.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                 {authError && (
                    <p className="text-sm font-medium text-destructive">{authError}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={handleSignup} disabled={isLoading} className="w-full">
                  {isLoading ? "Signing up..." : "Sign Up"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                Or continue with
                </span>
            </div>
        </div>
        <Button variant="outline" onClick={handleAnonymousLogin} disabled={isLoading} className="w-full">
          {isLoading ? "Please wait..." : "Anonymous Login"}
        </Button>
      </div>
    </div>
  );
}
