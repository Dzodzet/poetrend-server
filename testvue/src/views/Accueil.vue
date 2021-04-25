<template>
  <div id="accueil">
    <div class="content mt-5" >
      <table>
        <thead>
          <tr>
            <th v-for="key in keys">
              {{ key }}

            </th>
          </tr>

        </thead>
        <tbody>
          <tr v-for="row in rows">
            <td>
              {{row["skill"]}}
            </td>
            <td>
              {{row["nb"]}}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import api from "../api"

console.log("acceuil.vue loaded")
export default {
  data(){
    console.log("about to run data from Accueil.vue")
    return {
      rows: [],
      keys: ["Skill","NB"]
      }
  },
  async created() {
    console.log("about to run created from Accueil.vue")
    this.rows = (await api.getSkills()).skills;
    this.rows = this.rows.sort(function IHaveAName(a, b) { // non-anonymous as you ordered...
    return b.nb > a.nb ?  1 // if b should come earlier, push a to end
         : b.nb < a.nb ? -1 // if b should come later, push a to begin
         : 0;                   // a and b are equal
          });
    //this.keys = Object.keys(this.rows);
    //console.log(this.rows)
  }
};

</script>