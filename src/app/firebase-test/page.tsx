"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { runFirebaseTests } from '@/utils/firebase-test';

interface TestResult {
  connection: any;
  collections: any;
  addTransaction: any;
  realtime: any;
  allPassed: boolean;
}

export default function FirebaseTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const runTests = async () => {
    setIsRunning(true);
    setLogs([]);
    setTestResults(null);

    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      setLogs(prev => [...prev, `LOG: ${args.join(' ')}`]);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      setLogs(prev => [...prev, `ERROR: ${args.join(' ')}`]);
      originalError(...args);
    };

    try {
      const results = await runFirebaseTests();
      setTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
      // Restore original console methods
      console.log = originalLog;
      console.error = originalError;
    }
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? 'default' : 'destructive'}>
        {success ? 'PASS' : 'FAIL'}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Firebase Integration Test</h1>
          <p className="text-muted-foreground mt-2">
            Test Firebase connection, collections, and real-time functionality
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>
              Run comprehensive Firebase integration tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? 'Running Tests...' : 'Run Firebase Tests'}
            </Button>
          </CardContent>
        </Card>

        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Firebase integration test results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Firebase Connection</span>
                  {getStatusBadge(testResults.connection.success)}
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Collections Access</span>
                  {getStatusBadge(Object.values(testResults.collections).every(r => r.success))}
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Add Transaction</span>
                  {getStatusBadge(testResults.addTransaction.success)}
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Real-time Updates</span>
                  {getStatusBadge(testResults.realtime.success)}
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Overall Result:</h4>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(testResults.allPassed)}
                  <span className="text-lg font-medium">
                    {testResults.allPassed ? 'All Tests Passed!' : 'Some Tests Failed'}
                  </span>
                </div>
              </div>

              {testResults.collections && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Collection Details:</h4>
                  <div className="space-y-2">
                    {Object.entries(testResults.collections).map(([name, result]: [string, any]) => (
                      <div key={name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-mono">{name}</span>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(result.success)}
                          {result.success && (
                            <span className="text-sm text-gray-600">
                              {result.count} documents
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Logs</CardTitle>
              <CardDescription>
                Detailed test execution logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className={log.startsWith('ERROR') ? 'text-red-400' : ''}>
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Firebase Configuration</CardTitle>
            <CardDescription>
              Current Firebase configuration status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>API Key</span>
                <Badge variant={process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'default' : 'destructive'}>
                  {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Project ID</span>
                <Badge variant={process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'default' : 'destructive'}>
                  {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Set' : 'Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Auth Domain</span>
                <Badge variant={process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'default' : 'destructive'}>
                  {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


