import { Box, Typography, Container, CircularProgress, Alert, Card, CardContent, CardHeader } from '@mui/material';
import { useEffect, useState } from 'react';
import { getDashboardData, getWeeklyVisitSalesComparisonData, getWeeklyCustomerOrderData } from '../api/frappeApi';
import { Link } from 'react-router-dom';
import EventNoteIcon from '@mui/icons-material/EventNote';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import PercentIcon from '@mui/icons-material/Percent';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; // New icon for outstanding sales

// Chart imports
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface DashboardData {
  total_visits_today: number;
  pending_visits: number;
  completed_visits_today: number;
  total_sales_month: number;
  total_outstanding_sales: number;
  achievement_percentage: number;
}

interface WeeklyVisitSalesComparisonData {
  labels: string[];
  datasets: { label: string; data: number[] }[];
}

interface WeeklyCustomerOrderData {
  data: { week: string; [customer: string]: number | string }[];
}

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [weeklyVisitSalesComparisonData, setWeeklyVisitSalesComparisonData] = useState<WeeklyVisitSalesComparisonData | null>(null);
  const [weeklyCustomerOrderData, setWeeklyCustomerOrderData] = useState<WeeklyCustomerOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllDashboardData = async () => {
      try {
        setLoading(true);
        const [dashData, visitSalesData, customerOrderData] = await Promise.all([
          getDashboardData(),
          getWeeklyVisitSalesComparisonData(),
          getWeeklyCustomerOrderData(),
        ]);
        setDashboardData(dashData);
        setWeeklyVisitSalesComparisonData(visitSalesData);
        setWeeklyCustomerOrderData(customerOrderData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Doughnut chart data for Percentage Achievement
  const achievementData = {
    labels: ['Achieved', 'Remaining'],
    datasets: [
      {
        data: [dashboardData?.achievement_percentage ?? 0, 100 - (dashboardData?.achievement_percentage ?? 0)],
        backgroundColor: ['#4CAF50', '#E0E0E0'],
        hoverBackgroundColor: ['#4CAF50', '#E0E0E0'],
      },
    ],
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
        {/* Card 1: Total Kunjungan */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card component={Link} to="/schedule" sx={{ textDecoration: 'none', color: 'inherit', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              avatar={<EventNoteIcon color="primary" />}
              title="Total Visit Hari Ini"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              sx={{ backgroundColor: 'grey.100' }}
            />
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="h2" component="div" fontWeight="bold">
                {dashboardData?.total_visits_today ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                (Klik untuk detail jadwal)
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Card 2: Kunjungan Belum Selesai */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              avatar={<HourglassTopIcon color="primary" />}
              title="Outstanding Visit"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              sx={{ backgroundColor: 'grey.100' }}
            />
            <CardContent sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="h2" component="div" fontWeight="bold">
                {dashboardData?.pending_visits ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Card 3: Persentase Pencapaian (Doughnut Chart) */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              avatar={<PercentIcon color="primary" />}
              title="Achievements"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              sx={{ backgroundColor: 'grey.100' }}
            />
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Box sx={{ width: '100%', maxWidth: 200, height: 200 }}>
                <Doughnut data={achievementData} options={{ responsive: true, maintainAspectRatio: false }} />
              </Box>
              <Typography variant="h5" component="div" fontWeight="bold" sx={{ mt: 2 }}>
                {dashboardData?.achievement_percentage?.toFixed(2) ?? 0}%
              </Typography>
            </CardContent>
          </Card>
        </Box>


        {/* Card: Comparison Visit with Sales Order (Weekly Bar Chart) */}
        <Box sx={{ gridColumn: 'span 12' }}>
          <Card>
            <CardHeader title="Comparison: Visits vs. Planning (Weekly)" titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }} sx={{ backgroundColor: 'grey.100' }} />
            <CardContent>
              {weeklyVisitSalesComparisonData && weeklyVisitSalesComparisonData.labels && weeklyVisitSalesComparisonData.labels.length > 0 ? (
                <Bar
                  data={{
                    labels: weeklyVisitSalesComparisonData.labels,
                    datasets: weeklyVisitSalesComparisonData.datasets.map(dataset => ({
                      label: dataset.label,
                      data: dataset.data,
                      backgroundColor: dataset.label === 'Visits' ? 'rgba(75, 192, 192, 0.6)' : 'rgba(153, 102, 255, 0.6)',
                    })),
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Weekly Visits and Sales Orders',
                      },
                    },
                  }}
                />
              ) : (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc', borderRadius: 1, mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    No weekly visit and sales data available.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Card: Weekly Order Grouped by Customer (Table Grid) */}
        <Box sx={{ gridColumn: 'span 12' }}>
          <Card>
            <CardHeader title="Weekly Orders by Customer" titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }} sx={{ backgroundColor: 'grey.100' }} />
            <CardContent>
              {weeklyCustomerOrderData && weeklyCustomerOrderData.data.length > 0 ? (
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Week</th>
                        {/* Dynamically generate customer headers */}
                        {weeklyCustomerOrderData.data.length > 0 &&
                          Object.keys(weeklyCustomerOrderData.data[0]).filter(key => key !== 'week').map(customer => (
                            <th key={customer} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{customer}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyCustomerOrderData.data.map((row, index) => (
                        <tr key={index}>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.week}</td>
                          {Object.keys(row).filter(key => key !== 'week').map(customer => (
                            <td key={customer} style={{ border: '1px solid #ddd', padding: '8px' }}>
                              Rp {typeof row[customer] === 'number' ? row[customer]?.toLocaleString('id-ID') : row[customer] ?? 0}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              ) : (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc', borderRadius: 1, mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    No weekly customer order data available.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default DashboardPage;
