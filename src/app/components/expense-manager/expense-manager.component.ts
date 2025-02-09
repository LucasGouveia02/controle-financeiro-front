import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface Expense {
  id: number;
  nome: string;
  descricao: string;
  valor: number;
  grupoGastos: string;
  parcela: string | null;
  dataInicio: string;
}

interface GroupedExpenses {
  [grupoGastos: string]: Expense[];
}

interface TotalByCategory {
  [grupoGastos: string]: number;
}

@Component({
  selector: 'app-expense-manager',
  templateUrl: './expense-manager.component.html',
  styleUrls: ['./expense-manager.component.css'],
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule]
})
export class ExpenseManagerComponent implements OnInit {
  expenses: Expense[] = [];
  groupedExpenses: GroupedExpenses = {};
  totalByCategory: TotalByCategory = {};
  grandTotal: number = 0;
  selectedMonth: string = '';
  selectedYear: number = 0;
  isEditModalOpen: boolean = false;
  selectedExpense: Expense | null = null;
  gruposGastos: { id: number, nome: string }[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const currentDate = new Date();
    this.selectedMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    this.selectedYear = currentDate.getFullYear();
    this.fetchExpenses(this.selectedMonth, this.selectedYear);
    this.fetchGruposGastos();
  }

  fetchExpenses(month: string, year: number) {
    const url = `http://localhost:8080/gastos/listar/${month}-${year}`;
    this.http.get<Expense[]>(url)
      .pipe(
        catchError(error => {
          console.error('Error fetching expenses:', error);
          return throwError(error);
        })
      )
      .subscribe(data => {
        this.expenses = data;
        this.groupExpenses();
      });
  }

  fetchGruposGastos() {
    const url = 'http://localhost:8080/grupo-gastos/listar';
    this.http.get<{ id: number, nome: string }[]>(url)
      .pipe(
        catchError(error => {
          console.error('Error fetching grupos de gastos:', error);
          return throwError(error);
        })
      )
      .subscribe(data => {
        this.gruposGastos = data;
      });
  }

  getGroupedExpenseKeys(): string[] {
    return Object.keys(this.groupedExpenses);
  }

  groupExpenses() {
    this.groupedExpenses = this.expenses.reduce((acc: GroupedExpenses, expense: Expense) => {
      if (!acc[expense.grupoGastos]) {
        acc[expense.grupoGastos] = [];
      }
      acc[expense.grupoGastos].push(expense);
      return acc;
    }, {});

    this.calculateTotals();
  }

  calculateTotals() {
    this.totalByCategory = {};
    this.grandTotal = 0;

    for (const grupoGastos in this.groupedExpenses) {
      this.totalByCategory[grupoGastos] = this.groupedExpenses[grupoGastos].reduce((sum, expense) => sum + expense.valor, 0);
      this.grandTotal += this.totalByCategory[grupoGastos];
    }
  }

  onMonthChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const [year, month] = target.value.split('-');
    this.selectedMonth = month;
    this.selectedYear = parseInt(year, 10);
    this.fetchExpenses(this.selectedMonth, this.selectedYear);
  }

  openEditModal(expense: Expense) {
    this.selectedExpense = { ...expense };
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedExpense = null;
  }

  updateExpense() {
    if (this.selectedExpense) {
      const url = `http://localhost:8080/gastos/atualizar/${this.selectedExpense.id}`;
      this.http.put(url, this.selectedExpense)
        .pipe(
          catchError(error => {
            console.error('Error updating expense:', error);
            return throwError(error);
          })
        )
        .subscribe(() => {
          this.fetchExpenses(this.selectedMonth, this.selectedYear);
          this.closeEditModal();
        });
    }
  }
}