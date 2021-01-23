int a = 0.0;
const float b = 1.0;

float g(int n){
  return n * n + 1.0;
}

int main(){
  
  float k = 0.0;
  for(int i = 0; i < 4; ++i){
    k += g(i);
  }
  
  return int(g(int(k)));
}