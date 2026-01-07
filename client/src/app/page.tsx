import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowUpRight, TrendingUp, AlertCircle, Plus } from 'lucide-react';

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">GetCardIQ</h1>
          <p className="text-gray-500">Rewards Intelligence Dashboard</p>
        </div>
        <div className="flex space-x-4">
          <Link href="/cards/new">
            <Button variant="outline"><Plus className="w-4 h-4 mr-2" /> Add Card</Button>
          </Link>
          <Button>Sync Data</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">

          {/* Net Worth / Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-blue-500/20 shadow-xl">
              <CardHeader className="pb-2"><span className="text-blue-100 text-sm font-medium">Net Worth</span></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$124,592</div>
                <div className="flex items-center mt-2 text-blue-200 text-sm">
                  <TrendingUp className="w-4 h-4 mr-1" /> +2.4% this month
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><span className="text-gray-500 text-sm font-medium">Monthly Spend</span></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$4,231</div>
                <div className="flex items-center mt-2 text-gray-400 text-sm">
                  Avg $3.8k
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><span className="text-gray-500 text-sm font-medium">Reward Points Est.</span></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12,450</div>
                <div className="flex items-center mt-2 text-green-500 text-sm">
                  ~$124.50 Value
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Intelligence Summary */}
          <Card className="border-blue-100 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-900/10">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <CardTitle>Intelligence Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-orange-100 dark:border-orange-900/30">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-orange-700 dark:text-orange-400">Missed Opportunity Detected</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    You spent <strong>$145.00</strong> at <em>Trader Joe's</em> using <strong>Chase Freedom</strong> (1x), but could have earned <strong>4x</strong> with <strong>Amex Gold</strong>.
                  </p>
                  <p className="text-xs font-medium text-orange-600 mt-2">Potential Loss: ~435 pts ($4.35)</p>
                </div>
              </div>

              <div className="flex items-start p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3 mt-0.5 text-green-600">
                  <ArrowUpRight className="w-3 h-3" />
                </div>
                <div>
                  <h4 className="font-medium">Optimization Win</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Great job using <strong>CSP</strong> for your $800 travel booking. You earned <strong>2,400 pts</strong>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions Stub */}
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
                {[1, 2, 3].map(i => (
                  <div key={i} className="py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-500">TJ</span>
                      </div>
                      <div>
                        <p className="font-medium">Trader Joe's</p>
                        <p className="text-xs text-gray-500">Groceries • Amex Gold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">-$45.20</p>
                      <p className="text-xs text-green-500">+180 pts</p>
                    </div>
                  </div>
                ))}
                <div className="py-3 text-center">
                  <Button variant="ghost" size="sm" className="text-blue-500">View All Transactions</Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Wallet Preview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>My Wallet</CardTitle>
                <Link href="/cards/new" className="text-blue-500 hover:underline text-sm">Add</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {['Amex Gold', 'Chase Sapphire Preferred', 'Bilt Mastercard'].map(card => (
                <div key={card} className="p-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl shadow-lg flex justify-between items-center">
                  <span className="font-medium text-sm">{card}</span>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">.... 4242</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Weekly Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-gray-100 dark:border-gray-800 border-t-blue-500 rotate-45 transform">
                  <div className="text-center -rotate-45">
                    <span className="block text-2xl font-bold">84%</span>
                    <span className="text-xs text-gray-500">Optimized</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">You missed ~$12.50 in value this week.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
