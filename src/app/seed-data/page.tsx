"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { seedAllTreasuryData, checkExistingData } from '@/utils/seedFirebaseData';
import { toast } from 'sonner';
import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SeedDataPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [existingData, setExistingData] = useState<{ balances: number; transactions: number } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckData = async () => {
    setIsChecking(true);
    try {
      const data = await checkExistingData();
      setExistingData(data);
      toast.success('Data check completed');
    } catch (error) {
      console.error('Error checking data:', error);
      toast.error('Failed to check existing data');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedAllTreasuryData();
      toast.success('Firebase data seeded successfully!');
      
      // Refresh the data count
      const data = await checkExistingData();
      setExistingData(data);
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Failed to seed Firebase data');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Database className="h-8 w-8 text-blue-600" />
            Firebase Data Seeding
          </h1>
          <p className="text-muted-foreground">
            Seed your Firebase collections with sample treasury data for testing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Check Existing Data
              </CardTitle>
              <CardDescription>
                Check how many records already exist in Firebase collections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleCheckData}
                disabled={isChecking}
                className="w-full"
                variant="outline"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Data'
                )}
              </Button>
              
              {existingData && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Treasury Balances:</span>
                    <Badge variant={existingData.balances > 0 ? "default" : "secondary"}>
                      {existingData.balances} records
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Treasury Transactions:</span>
                    <Badge variant={existingData.transactions > 0 ? "default" : "secondary"}>
                      {existingData.transactions} records
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Seed Sample Data
              </CardTitle>
              <CardDescription>
                Add sample treasury balances and transactions to Firebase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleSeedData}
                disabled={isSeeding}
                className="w-full"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  'Seed Data'
                )}
              </Button>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>This will add:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>4 treasury balance records</li>
                  <li>8 sample transaction records</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm space-y-2">
              <p>• This tool adds sample data to your Firebase collections for testing purposes</p>
              <p>• The data includes realistic treasury balances and transaction history</p>
              <p>• After seeding, your admin dashboard will show real Firebase data instead of mock data</p>
              <p>• You can run this multiple times - it will add new records each time</p>
              <p>• To clear data, you'll need to manually delete records from Firebase Console</p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            onClick={() => window.location.href = '/admin'}
            variant="outline"
            className="mr-4"
          >
            Go to Admin Dashboard
          </Button>
          <Button 
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
