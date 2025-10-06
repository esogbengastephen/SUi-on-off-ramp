import { Layout } from "@/components/layout/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function About() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">About SUI App</h1>
            <p className="text-xl text-muted-foreground">
              Learn more about our mission and the technology behind our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Our Mission</CardTitle>
                <CardDescription>
                  Building the future of web applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We're dedicated to creating modern, efficient, and user-friendly web applications 
                  that leverage the latest technologies to deliver exceptional user experiences.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technology Stack</CardTitle>
                <CardDescription>
                  Built with modern tools and frameworks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Next.js 14 with App Router</li>
                  <li>• TypeScript for type safety</li>
                  <li>• Tailwind CSS for styling</li>
                  <li>• Radix UI for components</li>
                  <li>• React 18 with hooks</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Why Choose Us?</CardTitle>
              <CardDescription>
                What makes our platform special
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold">Performance</h4>
                  <p className="text-sm text-muted-foreground">
                    Optimized for speed and efficiency with modern web technologies.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Security</h4>
                  <p className="text-sm text-muted-foreground">
                    Built with security best practices and modern authentication.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Scalability</h4>
                  <p className="text-sm text-muted-foreground">
                    Designed to grow with your needs and handle increased traffic.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
