import { collection, query, writeBatch, onSnapshot, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../settings/firebaseConfig';
import { expenseRepository } from './ExpenseRepository';
import { incomeRepository } from './IncomeRepository';
import { TransactionEntity } from '../entity/TransactionEntity';
import { AmountByMonth } from '../entity/AmountByMonth';

class TransactionRepository {
    expense = expenseRepository;
    income = incomeRepository;
    constructor() {
        this.docRef = (id) => doc(firestore, 'finances/igreja/transactions', id);
        this.collectionRef = collection(firestore, 'finances/igreja/transactions');
    }

    observeTransactionForSelectedMonth(setTransaction, { selectedMonth, selectedYear, sortOrder, sortBy }) {
        const startDate = new Date(selectedYear, selectedMonth, 1);
        const endDate = new Date(selectedYear, selectedMonth + 1, 0);

        const q = query(this.collectionRef,
            where("dueDate", ">=", startDate),
            where("dueDate", "<=", endDate),
            orderBy(sortBy || "dueDate", sortOrder || "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const expenses = snapshot.docs.map(doc => TransactionEntity.fromFirebase({ ...doc.data(), id: doc.id }));
            setTransaction(expenses);
        });

        return unsubscribe;
    }

    observeTransactionAmountByMonth(seExpenseMonths, setLoading) {
        const q = query(this.collectionRef, orderBy("dueDate", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const expenseMonths = {};
            const incomeMonths = {};
            const month = {};
            const year = {};
            snapshot.docs.forEach(doc => {
                const data = TransactionEntity.fromFirebase({ ...doc.data(), id: doc.id });
                const dueDate = data?.dueDate;
                if (dueDate) {
                    const monthYearKey = dueDate.toLocaleString('default', { month: 'long', year: 'numeric' });
                    if (!expenseMonths[monthYearKey]) {
                        expenseMonths[monthYearKey] = 0;
                    }
                    if (!incomeMonths[monthYearKey]) {
                        incomeMonths[monthYearKey] = 0;
                    }

                    if (data.typeTransaction === 'income') {
                        incomeMonths[monthYearKey] += data.amount;
                    } else {
                        expenseMonths[monthYearKey] += data.amount;
                    }
                    month[monthYearKey] = dueDate.getMonth();
                    year[monthYearKey] = dueDate.getFullYear();
                }
            });

            const sortedMonths = Object.keys(expenseMonths).sort((a, b) => new Date(b) - new Date(a)).map(key => ({
                monthId: key,
                month: month[key],
                year: year[key],
                expenseMonth: expenseMonths[key],
                incomeMonth: incomeMonths[key],
                totalMonth: incomeMonths[key] - expenseMonths[key],
            }));

            seExpenseMonths(sortedMonths);
            setLoading(false);
        }, (error) => {
            console.error("Error observing expense by month:", error);
            setLoading(false);
        });

        return unsubscribe;
    }

    observeAmountByMonth(setTransaction) {
        const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        const q = query(this.collectionRef,
            where("dueDate", ">=", startDate),
            where("dueDate", "<=", endDate),
            orderBy("dueDate", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const amountByMonth = new AmountByMonth();
            const transactionList = snapshot.docs.map(d => TransactionEntity.fromFirebase(d.data()));
            const filterTransactionList = (typeTransaction) => transactionList?.filter(t => t.typeTransaction === typeTransaction) ?? [];
            amountByMonth.income = filterTransactionList('income')?.reduce((acc, d) => acc + d.amount || 0, 0)
            amountByMonth.expense = filterTransactionList('expense')?.reduce((acc, d) => acc + d.amount || 0, 0)
            amountByMonth.total = amountByMonth.income - amountByMonth.expense
            setTransaction(amountByMonth);
        });
        return unsubscribe;
    }

    // Método para adicionar uma despesa recorrente
    async addRecurringExpense(expense, recurrencePeriod) {
        try {
            const batch = writeBatch(firestore);
            const currentDate = new Date();
            for (let i = 0; i < recurrencePeriod; i++) {
                const recurringDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, expense.transactionDate.getDate());
                const newExpense = { ...expense, transactionDate: recurringDate };
                const newDocRef = doc(this.collectionRef);
                batch.set(newDocRef, newExpense);
            }
            await batch.commit();
            console.log(`${recurrencePeriod} recurring expenses successfully added.`);
        } catch (error) {
            console.error("Error adding recurring expense: ", error);
        }
    }

    // Método para atualizar o status de uma despesa
    async updateExpenseStatus(expenseId, newStatus) {
        try {
            const expenseRef = doc(this.collectionRef, expenseId);
            await updateDoc(expenseRef, { status: newStatus });
            console.log("Expense status successfully updated to: ", newStatus);
        } catch (error) {
            console.error("Error updating expense status: ", error);
        }
    }

}
// Exporta uma instância do repositório para ser utilizada no aplicativo

export const transactionRepository = new TransactionRepository();
