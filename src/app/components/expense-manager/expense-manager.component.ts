import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface Expense {
  nome: string;
  descricao: string;
  valor: number;
  grupoGastos: string;
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
  imports: [CommonModule, HttpClientModule]
})
export class ExpenseManagerComponent implements OnInit {
  expenses: Expense[] = [];
  groupedExpenses: GroupedExpenses = {};
  totalByCategory: TotalByCategory = {};
  grandTotal: number = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchExpenses();
  }

  fetchExpenses() {
    this.http.get<Expense[]>('http://localhost:8080/gastos/listar')
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
}