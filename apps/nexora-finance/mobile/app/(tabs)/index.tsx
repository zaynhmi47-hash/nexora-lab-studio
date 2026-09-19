import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import { AdaptiveHeader, ResponsiveContainer, ResponsiveGrid, ResponsiveScaffold } from '@/components/layout';
import { useResponsive } from '@/lib/responsive';
import { theme } from '@/lib/theme';
import { useGoals } from '@/lib/features/goals';
import { useFinanceBudgetSummary, useFinanceCategoryBreakdown, useFinanceCashFlow, useFinanceComparison, useFinanceInsights, useFinancePlanning, useFinanceProfitLoss, useFinanceSummary, useFinanceTrend } from '@/lib/features/summary';
import { useTransactions } from '@/lib/features/transactions';

type PeriodKey = 'this_month' | 'last_month' | 'three_months';
type TrendGranularity = 'day' | 'week' | 'month';

interface PeriodOption { key: PeriodKey; label: string }
interface TrendOption { key: TrendGranularity; label: string }

const PERIODS: PeriodOption[] = [
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'three_months', label: 'Last 3 months' },
];

const TREND_OPTIONS: TrendOption[] = [
  { key: 'day', label: 'Daily' },
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
];

const toDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
};

function getPeriodDates(key: PeriodKey) {
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  if (key === 'last_month') {
    return {
      startDate: toDateString(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      endDate: toDateString(new Date(today.getFullYear(), today.getMonth(), 0)),
    };
  }
  if (key === 'three_months') {
    return {
      startDate: toDateString(new Date(today.getFullYear(), today.getMonth() - 2, 1)),
      endDate: toDateString(today),
    };
  }
  return { startDate: toDateString(currentMonthStart), endDate: toDateString(today) };
}

const formatIdr = (amountMinor: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amountMinor);

const compactIdr = (value: number) => {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return 'Rp' + (value / 1_000_000_000).toFixed(1) + ' M';
  if (absolute >= 1_000_000) return 'Rp' + (value / 1_000_000).toFixed(1) + ' jt';
  if (absolute >= 1_000) return 'Rp' + (value / 1_000).toFixed(0) + ' rb';
  return 'Rp' + Math.round(value);
};

export default function HomeScreen() {
  const { isMobile } = useResponsive();
  const router = useRouter();
  const [periodKey, setPeriodKey] = useState<PeriodKey>('this_month');
  const [granularity, setGranularity] = useState<TrendGranularity>('day');
  const period = useMemo(() => getPeriodDates(periodKey), [periodKey]);

  const { summary, loading: summaryLoading, error: summaryError } = useFinanceSummary(period);
  const { goals, loading: goalsLoading, error: goalsError } = useGoals();
  const { summary: budgetSummary, loading: budgetLoading, error: budgetError } = useFinanceBudgetSummary(period);
  const { summary: planningSummary, loading: planningLoading, error: planningError } = useFinancePlanning(period);
  const { comparison, loading: comparisonLoading, error: comparisonError } = useFinanceComparison(period);
  const { report: profitLoss, loading: profitLossLoading, error: profitLossError } = useFinanceProfitLoss(period);
  const { cashFlow, loading: cashFlowLoading, error: cashFlowError } = useFinanceCashFlow(period);
  const { report: insightsReport, loading: insightsLoading, error: insightsError } = useFinanceInsights(period);
  const { breakdown, loading: breakdownLoading, error: breakdownError } = useFinanceCategoryBreakdown(period);
  const { points: trend, loading: trendLoading, error: trendError } = useFinanceTrend(period, granularity);
  const { transactions, loading: transactionsLoading, error: transactionsError } =
    useTransactions({ status: 'posted', startDate: period.startDate, endDate: period.endDate, page: 1, pageSize: 8 });

  const loading = summaryLoading || goalsLoading || breakdownLoading || trendLoading || transactionsLoading || comparisonLoading || profitLossLoading || cashFlowLoading || insightsLoading || budgetLoading || planningLoading;
  const error = summaryError ?? goalsError ?? breakdownError ?? trendError ?? transactionsError ?? comparisonError ?? profitLossError ?? cashFlowError ?? insightsError ?? budgetError ?? planningError;

  const incomeBreakdown = useMemo(() => breakdown.filter((item) => item.direction === 'income'), [breakdown]);
  const expenseBreakdown = useMemo(() => breakdown.filter((item) => item.direction === 'expense'), [breakdown]);

  const trendMax = useMemo(
    () => Math.max(1, ...trend.flatMap((item) => [item.incomeMinor, item.expenseMinor])),
    [trend],
  );

  const renderBreakdown = (title: string, rows: typeof breakdown, total: number) => (
    <View style={styles.breakdownCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {breakdownLoading && rows.length === 0 ? <Text style={styles.hint}>Loading breakdown…</Text> :
       rows.length === 0 ? <Text style={styles.hint}>No posted {title.toLowerCase()} for this period.</Text> :
       rows.slice(0, 6).map((item) => {
         const percentage = total > 0 ? (item.amountMinor / total) * 100 : 0;
         return (
           <View key={item.direction + ':' + item.category} style={styles.breakdownRow}>
             <View style={styles.breakdownMain}>
               <View style={styles.breakdownTitleRow}>
                 <Text style={styles.breakdownCategory} numberOfLines={1}>{item.category}</Text>
                 <Text style={styles.breakdownPercentage}>{percentage.toFixed(0)}%</Text>
               </View>
               <View style={styles.progressTrack}><View style={[styles.progressFill, { width: percentage + '%' }]} /></View>
               <Text style={styles.hint}>{item.transactionCount} transaction{item.transactionCount === 1 ? '' : 's'}</Text>
             </View>
             <Text style={styles.breakdownAmount}>{formatIdr(item.amountMinor)}</Text>
           </View>
         );
       })}
    </View>
  );

  const renderTrend = () => (
    <View style={styles.trendCard}>
      <View style={styles.trendHeader}>
        <View style={styles.trendTitleBlock}>
          <Text style={styles.sectionTitle}>Cash flow trend</Text>
          <Text style={styles.hint}>Posted income and expenses over the selected period</Text>
        </View>
        <View style={styles.trendLegend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, styles.incomeDot]} /><Text style={styles.hint}>Income</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, styles.expenseDot]} /><Text style={styles.hint}>Expenses</Text></View>
        </View>
      </View>
      <View style={styles.granularityRow}>
        {TREND_OPTIONS.map((option) => {
          const selected = option.key === granularity;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setGranularity(option.key)}
              style={[styles.granularityButton, selected && styles.granularityButtonSelected]}
            >
              <Text style={[styles.granularityText, selected && styles.granularityTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {trendLoading && trend.length === 0 ? <Text style={styles.hint}>Loading cash flow trend…</Text> :
       trend.length === 0 ? <View style={styles.emptyTrend}><Text style={styles.emptyTitle}>No cash flow data</Text><Text style={styles.hint}>Posted transactions will appear here once they exist in this period.</Text></View> :
       <View style={styles.chartArea}>
         <View style={styles.yAxis}>
           <Text style={styles.axisLabel}>{compactIdr(trendMax)}</Text>
           <Text style={styles.axisLabel}>{compactIdr(trendMax / 2)}</Text>
           <Text style={styles.axisLabel}>Rp0</Text>
         </View>
         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
           {trend.map((point) => {
             const incomeHeight = Math.max(3, (point.incomeMinor / trendMax) * 170);
             const expenseHeight = Math.max(3, (point.expenseMinor / trendMax) * 170);
             const netPositive = point.netCashFlowMinor >= 0;
             const label = granularity === 'month'
               ? new Date(point.periodStart).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
               : granularity === 'week'
                 ? new Date(point.periodStart).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
                 : new Date(point.periodStart).toLocaleDateString('id-ID', { day: '2-digit' });
             return (
               <View key={point.periodStart} style={styles.chartColumn}>
                 <View style={styles.barPair}>
                   <View style={[styles.bar, styles.incomeBar, { height: incomeHeight }]} />
                   <View style={[styles.bar, styles.expenseBar, { height: expenseHeight }]} />
                 </View>
                 <Text style={[styles.netLabel, netPositive ? styles.netPositive : styles.netNegative]}>
                   {netPositive ? '+' : '−'}{compactIdr(Math.abs(point.netCashFlowMinor))}
                 </Text>
                 <Text style={styles.axisLabel}>{label}</Text>
               </View>
             );
           })}
         </ScrollView>
       </View>}
      {trend.length > 0 ? (
        <View style={styles.trendSummaryRow}>
          <View><Text style={styles.hint}>Peak income</Text><Text style={styles.trendMetric}>{formatIdr(Math.max(...trend.map((item) => item.incomeMinor)))}</Text></View>
          <View><Text style={styles.hint}>Peak expense</Text><Text style={styles.trendMetric}>{formatIdr(Math.max(...trend.map((item) => item.expenseMinor)))}</Text></View>
          <View><Text style={styles.hint}>Net for period</Text><Text style={styles.trendMetric}>{formatIdr(trend.reduce((sum, item) => sum + item.netCashFlowMinor, 0))}</Text></View>
        </View>
      ) : null}
    </View>
  );

  return (
    <ResponsiveScaffold>
      <ResponsiveContainer maxWidth={1440}>
        <ScrollView contentContainerStyle={styles.content}>
          <AdaptiveHeader title="Dashboard" subtitle={summary ? 'Financial overview · ' + summary.startDate + ' to ' + summary.endDate : 'Your financial overview'} />

          <View style={styles.periodSection}>
            <Text style={styles.periodLabel}>Summary period</Text>
            <View style={styles.periodRow}>
              {PERIODS.map((option) => {
                const selected = option.key === periodKey;
                return <Pressable key={option.key} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setPeriodKey(option.key)} style={[styles.periodButton, selected && styles.periodButtonSelected]}>
                  <Text style={[styles.periodText, selected && styles.periodTextSelected]}>{option.label}</Text>
                </Pressable>;
              })}
            </View>
          </View>

          {error ? <View style={styles.alert}><Text style={styles.alertTitle}>Unable to load financial data</Text><Text style={styles.hint}>{error.message}</Text></View> : null}

          <ResponsiveGrid gap={12}>
            {[
              ['Income', loading && !summary ? 'Loading…' : formatIdr(summary?.totalIncomeMinor ?? 0), 'Posted income'],
              ['Expenses', loading && !summary ? 'Loading…' : formatIdr(summary?.totalExpenseMinor ?? 0), 'Posted expenses'],
              ['Net cash flow', loading && !summary ? 'Loading…' : formatIdr(summary?.netCashFlowMinor ?? 0), 'Income − expenses'],
              ['Transactions', loading && !summary ? 'Loading…' : String(summary?.transactionCount ?? 0), 'Posted transactions'],
            ].map(([label, value, hint]) => <View key={label} style={[styles.card, !isMobile && styles.cardWide]}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text><Text style={styles.hint}>{hint}</Text></View>)}
          </ResponsiveGrid>

          {renderTrend()}
          <View style={styles.planningCard}>
            <View style={styles.trendTitleBlock}>
              <Text style={styles.sectionTitle}>Financial Planning</Text>
              <Text style={styles.hint}>Actual cash flow combined with active budgets and savings goals</Text>
            </View>
            {planningLoading && !planningSummary ? (
              <Text style={styles.hint}>Loading planning summary…</Text>
            ) : planningSummary ? (
              <>
                <View style={styles.profitLossMetrics}>
                  <View style={styles.profitLossMetric}><Text style={styles.label}>Actual net cash flow</Text><Text style={styles.profitLossValue}>{formatIdr(planningSummary.actualNetCashFlowMinor)}</Text></View>
                  <View style={styles.profitLossMetric}><Text style={styles.label}>Planned spending</Text><Text style={styles.profitLossValue}>{formatIdr(planningSummary.plannedSpendingMinor)}</Text></View>
                  <View style={styles.profitLossMetric}><Text style={styles.label}>Planned saving</Text><Text style={styles.profitLossValue}>{formatIdr(planningSummary.plannedSavingMinor)}</Text></View>
                  <View style={styles.profitLossMetric}><Text style={styles.label}>Projected after plans</Text><Text style={styles.profitLossValue}>{formatIdr(planningSummary.projectedCashAfterPlansMinor)}</Text></View>
                </View>
                <View style={styles.planningDetails}>
                  <View style={styles.planningDetail}><Text style={styles.hint}>Saving gap</Text><Text style={styles.planningDetailValue}>{formatIdr(planningSummary.savingGapMinor)}</Text></View>
                  <View style={styles.planningDetail}><Text style={styles.hint}>Budget overages</Text><Text style={styles.planningDetailValue}>{String(planningSummary.overBudgetCount)}</Text></View>
                  <View style={styles.planningDetail}><Text style={styles.hint}>Active goals in plan</Text><Text style={styles.planningDetailValue}>{String(planningSummary.activeGoalCount)}</Text></View>
                  <View style={styles.planningBadge}><Text style={styles.planningBadgeText}>{planningSummary.planningStatus === 'on_track' ? 'On track' : planningSummary.planningStatus === 'saving_gap' ? 'Saving gap' : planningSummary.planningStatus === 'budget_overage' ? 'Budget overage' : 'Plans exceed income'}</Text></View>
                </View>
                <View style={styles.planningColumns}>
                  <View style={styles.planningColumn}>
                    <Text style={styles.subsectionTitle}>Budget pressure</Text>
                    {planningSummary.budgetItems.length === 0 ? (
                      <Text style={styles.hint}>No active budgets overlap this period.</Text>
                    ) : planningSummary.budgetItems.slice(0, 6).map((budget) => (
                      <View key={budget.budgetId} style={styles.planningRow}>
                        <View style={styles.planningRowMain}>
                          <Text style={styles.profitLossCategory} numberOfLines={1}>{budget.name}</Text>
                          <Text style={styles.hint}>{budget.category} · {budget.transactionCount} transaction{budget.transactionCount === 1 ? '' : 's'}</Text>
                          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: Math.min(100, budget.utilizationPercentage ?? 0) + '%' }]} /></View>
                        </View>
                        <View style={styles.planningRowAmount}>
                          <Text style={styles.breakdownAmount}>{formatIdr(budget.actualMinor)}</Text>
                          <Text style={styles.hint}>of {formatIdr(budget.budgetMinor)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                  <View style={styles.planningColumn}>
                    <Text style={styles.subsectionTitle}>Savings goals</Text>
                    {planningSummary.goalItems.length === 0 ? (
                      <Text style={styles.hint}>No active savings goal requires allocation in this period.</Text>
                    ) : planningSummary.goalItems.slice(0, 6).map((goal) => (
                      <View key={goal.goalId} style={styles.planningRow}>
                        <View style={styles.planningRowMain}>
                          <Text style={styles.profitLossCategory} numberOfLines={1}>{goal.name}</Text>
                          <Text style={styles.hint}>{goal.daysRemaining} day{goal.daysRemaining === 1 ? '' : 's'} remaining · {goal.progressPercentage === null ? '—' : goal.progressPercentage.toFixed(0) + '%'} complete</Text>
                          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: Math.min(100, goal.progressPercentage ?? 0) + '%' }]} /></View>
                        </View>
                        <View style={styles.planningRowAmount}>
                          <Text style={styles.breakdownAmount}>{formatIdr(goal.plannedSavingMinor)}</Text>
                          <Text style={styles.hint}>planned</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
                <Text style={styles.hint}>Projected after plans is a planning calculation, not a bank balance or available cash figure.</Text>
              </>
            ) : null}
          </View>
          <View style={styles.goalsCard}>
            <View style={styles.trendHeader}>
              <View style={styles.trendTitleBlock}>
                <Text style={styles.sectionTitle}>Financial Goals</Text>
                <Text style={styles.hint}>Your active savings targets</Text>
              </View>
              <Pressable onPress={() => { /* navigation is handled by the Goals tab */ }}>
                <Text style={styles.linkText}>Goals</Text>
              </Pressable>
            </View>
            {goalsLoading && goals.length === 0 ? <Text style={styles.hint}>Loading goals…</Text> :
             goals.length === 0 ? <Text style={styles.hint}>No active goals yet. Create one from the Goals tab.</Text> :
             <ResponsiveGrid gap={12}>
               {goals.slice(0, 4).map((goal) => (
                 <View key={goal.id} style={styles.goalSummaryItem}>
                   <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
                   <Text style={styles.goalTarget}>{formatIdr(goal.targetAmountMinor)}</Text>
                   <Text style={styles.hint}>{goal.startDate} → {goal.targetDate}</Text>
                 </View>
               ))}
             </ResponsiveGrid>}
          </View>


          {comparison ? (
            <View style={styles.comparisonCard}>
              <View style={styles.comparisonHeader}>
                <View style={styles.trendTitleBlock}>
                  <Text style={styles.sectionTitle}>Period comparison</Text>
                  <Text style={styles.hint}>
                    Current period compared with the immediately preceding period of the same length
                  </Text>
                </View>
                <Text style={styles.hint}>
                  {comparison.previousStartDate} → {comparison.previousEndDate}
                </Text>
              </View>
              <View style={styles.comparisonGrid}>
                {[
                  ['Income', comparison.income],
                  ['Expenses', comparison.expense],
                  ['Net cash flow', comparison.netCashFlow],
                  ['Transactions', comparison.transactionCount],
                ].map(([label, metric]) => {
                  const item = metric as typeof comparison.income;
                  const percentage = item.percentageChange;
                  const percentageLabel = percentage === null
                    ? '—'
                    : (percentage > 0 ? '+' : '') + percentage.toFixed(1) + '%';
                  return (
                    <View key={label as string} style={styles.comparisonItem}>
                      <Text style={styles.label}>{label as string}</Text>
                      <Text style={styles.comparisonCurrent}>
                        {label === 'Transactions' ? String(item.current) : formatIdr(item.current)}
                      </Text>
                      <Text style={styles.hint}>
                        {percentageLabel} · {item.delta > 0 ? '+' : item.delta < 0 ? '−' : ''}
                        {label === 'Transactions' ? Math.abs(item.delta) : formatIdr(Math.abs(item.delta))}
                      </Text>
                      <Text style={styles.comparisonPrevious}>
                        Previous: {label === 'Transactions' ? String(item.previous) : formatIdr(item.previous)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : comparisonLoading ? (
            <View style={styles.comparisonCard}><Text style={styles.hint}>Loading period comparison…</Text></View>
          ) : null}

          <View style={styles.insightsCard}>
            <View style={styles.trendTitleBlock}>
              <Text style={styles.sectionTitle}>Financial Insights</Text>
              <Text style={styles.hint}>Data-driven observations from posted transactions in the selected period</Text>
            </View>
            {insightsLoading && !insightsReport ? (
              <Text style={styles.hint}>Loading financial insights…</Text>
            ) : insightsReport && insightsReport.insights.length > 0 ? (
              <View style={styles.insightsList}>
                {insightsReport.insights.map((insight) => (
                  <View key={insight.code} style={styles.insightItem}>
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightTitle}>{insight.title}</Text>
                      <View style={[styles.insightBadge, insight.severity === 'warning' && styles.insightBadgeWarning]}>
                        <Text style={styles.insightBadgeText}>{insight.severity === 'warning' ? 'Attention' : 'Info'}</Text>
                      </View>
                    </View>
                    <Text style={styles.hint}>{insight.message}</Text>
                    {insight.category ? <Text style={styles.insightCategory}>{insight.category}</Text> : null}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.hint}>No notable observations were detected for this period.</Text>
            )}
          </View>

          <View style={styles.cashFlowAnalysisCard}>
            <View style={styles.trendTitleBlock}>
              <Text style={styles.sectionTitle}>Cash Flow Analysis</Text>
              <Text style={styles.hint}>Cash inflows and outflows from posted transactions in the selected period</Text>
            </View>
            {cashFlowLoading && !cashFlow ? <Text style={styles.hint}>Loading cash flow analysis…</Text> : cashFlow ? (
              <>
                <View style={styles.profitLossMetrics}>
                  <View style={styles.profitLossMetric}><Text style={styles.label}>Cash inflow</Text><Text style={styles.profitLossValue}>{formatIdr(cashFlow.cashInflowMinor)}</Text></View>
                  <View style={styles.profitLossMetric}><Text style={styles.label}>Cash outflow</Text><Text style={styles.profitLossValue}>{formatIdr(cashFlow.cashOutflowMinor)}</Text></View>
                  <View style={styles.profitLossMetric}><Text style={styles.label}>Net cash flow</Text><Text style={styles.profitLossValue}>{formatIdr(cashFlow.netCashFlowMinor)}</Text></View>
                  <View style={styles.profitLossMetric}><Text style={styles.label}>Transactions</Text><Text style={styles.profitLossValue}>{String(cashFlow.transactionCount)}</Text></View>
                </View>
                <View style={styles.profitLossColumns}>
                  <View style={styles.profitLossColumn}>
                    <Text style={styles.subsectionTitle}>Inflows by category</Text>
                    {cashFlow.inflowLines.length === 0 ? <Text style={styles.hint}>No posted cash inflows.</Text> : cashFlow.inflowLines.slice(0, 8).map((line) => (
                      <View key={'inflow:' + line.category} style={styles.profitLossLine}>
                        <View style={styles.profitLossLineMain}><Text style={styles.profitLossCategory} numberOfLines={1}>{line.category}</Text><Text style={styles.hint}>{line.transactionCount} transaction{line.transactionCount === 1 ? '' : 's'}</Text></View>
                        <Text style={styles.breakdownAmount}>{formatIdr(line.amountMinor)}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.profitLossColumn}>
                    <Text style={styles.subsectionTitle}>Outflows by category</Text>
                    {cashFlow.outflowLines.length === 0 ? <Text style={styles.hint}>No posted cash outflows.</Text> : cashFlow.outflowLines.slice(0, 8).map((line) => (
                      <View key={'outflow:' + line.category} style={styles.profitLossLine}>
                        <View style={styles.profitLossLineMain}><Text style={styles.profitLossCategory} numberOfLines={1}>{line.category}</Text><Text style={styles.hint}>{line.transactionCount} transaction{line.transactionCount === 1 ? '' : 's'}</Text></View>
                        <Text style={styles.breakdownAmount}>{formatIdr(line.amountMinor)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : null}
          </View>

          <View style={styles.budgetCard}>
            <View style={styles.trendTitleBlock}>
              <Text style={styles.sectionTitle}>Budget vs Actual</Text>
              <Text style={styles.hint}>Active expense budgets compared with posted expenses for the selected period</Text>
            </View>
            {budgetLoading && !budgetSummary ? (
              <Text style={styles.hint}>Loading budget summary…</Text>
            ) : budgetSummary ? (
              <>
                <View style={styles.profitLossMetrics}>
                  <View style={styles.profitLossMetric}><Text style={styles.label}>Budget</Text><Text style={styles.profitLossValue}>{formatIdr(budgetSummary.totalBudgetMinor)}</Text></View>
                  <View style={styles.profitLossMetric}><Text style={styles.label}>Actual</Text><Text style={styles.profitLossValue}>{formatIdr(budgetSummary.totalActualMinor)}</Text></View>
                  <View style={styles.profitLossMetric}><Text style={styles.label}>Remaining</Text><Text style={styles.profitLossValue}>{formatIdr(budgetSummary.totalRemainingMinor)}</Text></View>
                  <View style={styles.profitLossMetric}><Text style={styles.label}>Utilization</Text><Text style={styles.profitLossValue}>{budgetSummary.overallUtilizationPercentage === null ? '—' : budgetSummary.overallUtilizationPercentage.toFixed(1) + '%'}</Text></View>
                </View>
                {budgetSummary.budgets.length === 0 ? (
                  <Text style={styles.hint}>No active budgets overlap this period.</Text>
                ) : (
                  <View style={styles.budgetList}>
                    {budgetSummary.budgets.slice(0, 8).map((budget) => (
                      <View key={budget.budgetId} style={styles.budgetRow}>
                        <View style={styles.budgetMain}>
                          <View style={styles.breakdownTitleRow}>
                            <View style={styles.budgetNameBlock}>
                              <Text style={styles.profitLossCategory} numberOfLines={1}>{budget.name}</Text>
                              <Text style={styles.hint}>{budget.category} · {budget.transactionCount} transaction{budget.transactionCount === 1 ? '' : 's'}</Text>
                            </View>
                            <View style={[styles.budgetBadge, budget.status === 'over_budget' && styles.budgetBadgeOver, budget.status === 'near_limit' && styles.budgetBadgeNear]}>
                              <Text style={styles.budgetBadgeText}>{budget.status === 'over_budget' ? 'Over budget' : budget.status === 'near_limit' ? 'Near limit' : 'On track'}</Text>
                            </View>
                          </View>
                          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: Math.min(100, budget.utilizationPercentage ?? 0) + '%' }]} /></View>
                        </View>
                        <View style={styles.budgetAmountBlock}>
                          <Text style={styles.breakdownAmount}>{formatIdr(budget.actualMinor)}</Text>
                          <Text style={styles.hint}>of {formatIdr(budget.budgetMinor)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : null}
          </View>

          <View style={styles.profitLossCard}>
            <View style={styles.trendTitleBlock}>
              <Text style={styles.sectionTitle}>Profit &amp; Loss</Text>
              <Text style={styles.hint}>
                Posted income minus posted expenses for the selected period
              </Text>
            </View>
            {profitLossLoading && !profitLoss ? (
              <Text style={styles.hint}>Loading profit &amp; loss report…</Text>
            ) : profitLoss ? (
              <>
                <View style={styles.profitLossMetrics}>
                  <View style={styles.profitLossMetric}>
                    <Text style={styles.label}>Total income</Text>
                    <Text style={styles.profitLossValue}>{formatIdr(profitLoss.totalIncomeMinor)}</Text>
                  </View>
                  <View style={styles.profitLossMetric}>
                    <Text style={styles.label}>Total expenses</Text>
                    <Text style={styles.profitLossValue}>{formatIdr(profitLoss.totalExpenseMinor)}</Text>
                  </View>
                  <View style={styles.profitLossMetric}>
                    <Text style={styles.label}>Net profit</Text>
                    <Text style={styles.profitLossValue}>{formatIdr(profitLoss.netProfitMinor)}</Text>
                  </View>
                </View>
                <View style={styles.profitLossColumns}>
                  <View style={styles.profitLossColumn}>
                    <Text style={styles.subsectionTitle}>Income</Text>
                    {profitLoss.incomeLines.length === 0 ? (
                      <Text style={styles.hint}>No posted income.</Text>
                    ) : profitLoss.incomeLines.slice(0, 8).map((line) => (
                      <View key={'income:' + line.category} style={styles.profitLossLine}>
                        <View style={styles.profitLossLineMain}>
                          <Text style={styles.profitLossCategory} numberOfLines={1}>{line.category}</Text>
                          <Text style={styles.hint}>{line.transactionCount} transaction{line.transactionCount === 1 ? '' : 's'}</Text>
                        </View>
                        <Text style={styles.breakdownAmount}>{formatIdr(line.amountMinor)}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.profitLossColumn}>
                    <Text style={styles.subsectionTitle}>Expenses</Text>
                    {profitLoss.expenseLines.length === 0 ? (
                      <Text style={styles.hint}>No posted expenses.</Text>
                    ) : profitLoss.expenseLines.slice(0, 8).map((line) => (
                      <View key={'expense:' + line.category} style={styles.profitLossLine}>
                        <View style={styles.profitLossLineMain}>
                          <Text style={styles.profitLossCategory} numberOfLines={1}>{line.category}</Text>
                          <Text style={styles.hint}>{line.transactionCount} transaction{line.transactionCount === 1 ? '' : 's'}</Text>
                        </View>
                        <Text style={styles.breakdownAmount}>{formatIdr(line.amountMinor)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : null}
          </View>

          <ResponsiveGrid gap={12}>
            {renderBreakdown('Income by category', incomeBreakdown, summary?.totalIncomeMinor ?? 0)}
            {renderBreakdown('Expenses by category', expenseBreakdown, summary?.totalExpenseMinor ?? 0)}
          </ResponsiveGrid>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent transactions</Text>
            {transactionsLoading && transactions.length === 0 ? <Text style={styles.hint}>Loading transactions…</Text> :
             transactions.length === 0 ? <Text style={styles.hint}>No posted transactions in this period.</Text> :
             transactions.map((item) => <View key={item.id} style={styles.transactionRow}><View style={styles.transactionMain}><Text style={styles.transactionTitle}>{item.description || item.category}</Text><Text style={styles.hint}>{item.category} · {new Date(item.occurredAt).toLocaleDateString('id-ID')}</Text></View><Text style={[styles.transactionAmount, item.direction === 'expense' && styles.expenseAmount]}>{item.direction === 'expense' ? '−' : '+'}{formatIdr(item.amountMinor)}</Text></View>)}
          </View>
        </ScrollView>
      </ResponsiveContainer>
    </ResponsiveScaffold>
  );
}

const styles = StyleSheet.create({
  goalsCard: { padding: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 14 },
  goalSummaryItem: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, gap: 5 },
  goalName: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  goalTarget: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
  linkText: { color: theme.colors.primary, fontWeight: '700' },

  content: { paddingTop: 20, paddingBottom: 40, gap: 20 },
  periodSection: { padding: theme.spacing.lg, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 10 },
  periodLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  periodButton: { minHeight: 40, paddingHorizontal: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, justifyContent: 'center' },
  periodButtonSelected: { borderColor: theme.colors.text, backgroundColor: theme.colors.text },
  periodText: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  periodTextSelected: { color: theme.colors.surface },
  card: { width: '100%', padding: theme.spacing.xl, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 6 },
  cardWide: { width: '23.5%', minWidth: 220 },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.muted },
  value: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  hint: { fontSize: 14, lineHeight: 20, color: theme.colors.muted },
  alert: { padding: theme.spacing.lg, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 4 },
  alertTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  section: { padding: theme.spacing.xl, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  comparisonCard: { padding: theme.spacing.xl, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 16 },
  insightsCard: { padding: theme.spacing.xl, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 16 },
  insightsList: { gap: 10 },
  insightItem: { padding: theme.spacing.lg, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, gap: 7 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  insightTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.colors.text },
  insightBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: theme.radius.md, backgroundColor: theme.colors.border },
  insightBadgeWarning: { backgroundColor: theme.colors.text },
  insightBadgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.surface },
  insightCategory: { fontSize: 12, fontWeight: '700', color: theme.colors.text },
  cashFlowAnalysisCard: { padding: theme.spacing.xl, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 16 },
  planningCard: { padding: theme.spacing.xl, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 16 },
  planningColumns: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  planningColumn: { flex: 1, minWidth: 320, gap: 8 },
  planningRow: { minHeight: 72, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  planningRowMain: { flex: 1, gap: 4 },
  planningRowAmount: { minWidth: 90, alignItems: 'flex-end', gap: 2 },
  planningDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  planningDetail: { minWidth: 150, padding: theme.spacing.md, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, gap: 3 },
  planningDetailValue: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  planningBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: theme.radius.md, backgroundColor: theme.colors.text },
  planningBadgeText: { fontSize: 12, fontWeight: '700', color: theme.colors.surface },
  budgetCard: { padding: theme.spacing.xl, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 16 },
  budgetList: { gap: 0 },
  budgetRow: { minHeight: 72, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  budgetMain: { flex: 1, gap: 6 },
  budgetNameBlock: { flex: 1, gap: 2 },
  budgetAmountBlock: { minWidth: 120, alignItems: 'flex-end', gap: 2 },
  budgetBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: theme.radius.md, backgroundColor: theme.colors.border },
  budgetBadgeNear: { backgroundColor: theme.colors.muted },
  budgetBadgeOver: { backgroundColor: theme.colors.text },
  budgetBadgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.surface },
  profitLossCard: { padding: theme.spacing.xl, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 16 },
  profitLossMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  profitLossMetric: { flex: 1, minWidth: 190, padding: theme.spacing.lg, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, gap: 4 },
  profitLossValue: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  profitLossColumns: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  profitLossColumn: { flex: 1, minWidth: 320, gap: 8 },
  subsectionTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  profitLossLine: { minHeight: 58, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  profitLossLineMain: { flex: 1, gap: 2 },
  profitLossCategory: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  comparisonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  comparisonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  comparisonItem: { flex: 1, minWidth: 190, padding: theme.spacing.lg, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, gap: 4 },
  comparisonCurrent: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  comparisonPrevious: { fontSize: 12, color: theme.colors.muted },
  trendCard: { padding: theme.spacing.xl, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 16 },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  trendTitleBlock: { flex: 1, gap: 4 },
  trendLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  incomeDot: { backgroundColor: theme.colors.text },
  expenseDot: { backgroundColor: theme.colors.muted },
  granularityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  granularityButton: { minHeight: 36, paddingHorizontal: 12, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center' },
  granularityButtonSelected: { backgroundColor: theme.colors.text, borderColor: theme.colors.text },
  granularityText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  granularityTextSelected: { color: theme.colors.surface },
  chartArea: { minHeight: 250, flexDirection: 'row', gap: 10 },
  yAxis: { width: 64, justifyContent: 'space-between', paddingBottom: 24 },
  axisLabel: { fontSize: 11, color: theme.colors.muted },
  chartScroll: { minWidth: '100%', alignItems: 'flex-end', gap: 12, paddingRight: 8 },
  chartColumn: { width: 74, minHeight: 230, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  barPair: { height: 170, flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  bar: { width: 18, minHeight: 3, borderRadius: 4 },
  incomeBar: { backgroundColor: theme.colors.text },
  expenseBar: { backgroundColor: theme.colors.muted },
  netLabel: { maxWidth: 74, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  netPositive: { color: theme.colors.text },
  netNegative: { color: theme.colors.muted },
  emptyTrend: { minHeight: 190, alignItems: 'center', justifyContent: 'center', gap: 5 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  trendSummaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 28, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border },
  trendMetric: { marginTop: 3, fontSize: 15, fontWeight: '800', color: theme.colors.text },
  breakdownCard: { width: '100%', flex: 1, minWidth: 320, padding: theme.spacing.xl, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 12 },
  breakdownRow: { minHeight: 72, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  breakdownMain: { flex: 1, gap: 5 },
  breakdownTitleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  breakdownCategory: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.text },
  breakdownPercentage: { fontSize: 13, fontWeight: '700', color: theme.colors.muted },
  progressTrack: { height: 6, overflow: 'hidden', borderRadius: 3, backgroundColor: theme.colors.border },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: theme.colors.text },
  breakdownAmount: { fontSize: 14, fontWeight: '800', color: theme.colors.text },
  transactionRow: { minHeight: 64, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  transactionMain: { flex: 1, gap: 2 },
  transactionTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  transactionAmount: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  expenseAmount: { color: theme.colors.muted },
});
